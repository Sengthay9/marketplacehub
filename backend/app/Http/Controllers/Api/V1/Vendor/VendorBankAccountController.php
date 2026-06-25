<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\VendorBankAccount;
use App\Services\KhqrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class VendorBankAccountController extends Controller
{
    public function __construct(private KhqrService $khqr) {}

    private function getShop(Request $request)
    {
        $shop = $request->user()->shop;
        abort_unless($shop, 403, 'No shop found.');
        return $shop;
    }

    private function generateKhqr(array $data, string $shopName): ?string
    {
        $phone = $data['phone_number'] ?? null;
        if (!$this->khqr->canGenerate($phone)) {
            return null;
        }
        return $this->khqr->generate(
            phone:        $phone,
            merchantName: $shopName,
            storeLabel:   $shopName,
        );
    }

    private function toResponse(VendorBankAccount $acc): array
    {
        return array_merge($acc->toArray(), ['qr_image_url' => $acc->qrImageUrl()]);
    }

    public function index(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);
        return response()->json([
            'data' => $shop->bankAccounts()->orderByDesc('is_primary')->get()->map(fn($a) => $this->toResponse($a)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);

        // Only one Bakong account per shop
        if ($shop->bankAccounts()->count() >= 1) {
            return response()->json(['message' => 'You can only have one Bakong account.'], 422);
        }

        $data = $request->validate([
            'account_holder_name' => 'required|string|max:150',
            'account_number'      => 'nullable|string|max:60',
            'phone_number'        => 'required|string|max:30',
        ]);

        $data['bank_name']    = 'Bakong';
        $data['is_primary']   = true;
        $data['khqr_string']  = $this->generateKhqr($data, $shop->name);

        $account = $shop->bankAccounts()->create($data);
        return response()->json(['message' => 'Bakong account connected.', 'data' => $this->toResponse($account)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $shop    = $this->getShop($request);
        $account = $shop->bankAccounts()->findOrFail($id);

        $data = $request->validate([
            'account_holder_name' => 'sometimes|required|string|max:150',
            'account_number'      => 'nullable|string|max:60',
            'phone_number'        => 'sometimes|required|string|max:30',
        ]);

        $data['bank_name'] = 'Bakong';

        $merged = array_merge($account->toArray(), $data);
        $data['khqr_string'] = $this->generateKhqr($merged, $shop->name);

        $account->update($data);
        return response()->json(['message' => 'Bakong account updated.', 'data' => $this->toResponse($account)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $shop    = $this->getShop($request);
        $account = $shop->bankAccounts()->findOrFail($id);
        $account->delete();

        return response()->json(['message' => 'Bakong account disconnected.']);
    }

    public function setPrimary(Request $request, int $id): JsonResponse
    {
        $shop    = $this->getShop($request);
        $account = $shop->bankAccounts()->findOrFail($id);

        $shop->bankAccounts()->update(['is_primary' => false]);
        $account->update(['is_primary' => true]);

        return response()->json(['message' => 'Primary account updated.', 'data' => $account]);
    }

    /**
     * Return a dynamic KHQR string for a specific bank account with an order amount embedded.
     * Used at checkout so the customer's banking app pre-fills the exact order total.
     */
    public function dynamicQr(Request $request, int $id): JsonResponse
    {
        $shop    = $this->getShop($request);
        $account = $shop->bankAccounts()->findOrFail($id);

        $validated = $request->validate([
            'amount'      => 'nullable|numeric|min:0',
            'currency'    => 'nullable|string|in:USD,KHR',
            'bill_number' => 'nullable|string|max:25',
        ]);
        $currency = strtoupper($validated['currency'] ?? 'USD');

        if (!$this->khqr->canGenerate($account->phone_number)) {
            return response()->json(['message' => 'No phone number linked to this account.'], 422);
        }

        $khqrString = $this->khqr->generate(
            phone:         $account->phone_number,
            merchantName:  $shop->name,
            amount:        isset($validated['amount']) ? (float) $validated['amount'] : null,
            currency:      $currency,
            storeLabel:    $shop->name,
            billNumber:    $validated['bill_number'] ?? null,
            terminalLabel: 'Order Payment',
        );

        return response()->json(['khqr_string' => $khqrString]);
    }
}
