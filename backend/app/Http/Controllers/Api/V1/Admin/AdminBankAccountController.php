<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminBankAccount;
use App\Services\KhqrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBankAccountController extends Controller
{
    public function __construct(private KhqrService $khqr) {}

    private function format(AdminBankAccount $account): array
    {
        return [
            'id'                   => $account->id,
            'bank_name'            => $account->bank_name,
            'account_holder_name'  => $account->account_holder_name,
            'account_number'       => $account->account_number,
            'phone_number'         => $account->phone_number,
            'khqr_string'          => $account->khqr_string,
            'is_active'            => $account->is_active,
            'has_transfer_token'   => $account->hasTransferToken(),
        ];
    }

    public function show(): JsonResponse
    {
        $account = AdminBankAccount::first();
        return response()->json(['data' => $account ? $this->format($account) : null]);
    }

    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'account_holder_name'  => 'required|string|max:150',
            'account_number'       => 'nullable|string|max:60',
            'phone_number'         => 'required|string|max:30',
            'bakong_transfer_token'=> 'nullable|string|max:500',
            'is_active'            => 'boolean',
        ]);

        $data['bank_name']   = 'Bakong';
        $data['khqr_string'] = $this->khqr->canGenerate($data['phone_number'])
            ? $this->khqr->generate(
                phone:        $data['phone_number'],
                merchantName: $data['account_holder_name'],
                storeLabel:   'CamCart Platform',
            )
            : null;

        // Don't overwrite existing token if none provided
        if (empty($data['bakong_transfer_token'])) {
            unset($data['bakong_transfer_token']);
        }

        $account = AdminBankAccount::updateOrCreate(['id' => 1], $data);

        return response()->json([
            'message' => 'Bakong account saved.',
            'data'    => $this->format($account),
        ]);
    }

    public function destroy(): JsonResponse
    {
        AdminBankAccount::truncate();
        return response()->json(['message' => 'Bakong account removed.']);
    }

    // Public endpoint — used at checkout to show customers where to pay
    public function public(): JsonResponse
    {
        $account = AdminBankAccount::where('is_active', true)->first();

        if (!$account) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'account_holder_name' => $account->account_holder_name,
                'account_number'      => $account->account_number,
                'phone_number'        => $account->phone_number,
                'khqr_string'         => $account->khqr_string,
                'bank_name'           => $account->bank_name,
            ],
        ]);
    }

    // Public — generates a dynamic KHQR with the order amount pre-filled
    public function dynamicQr(Request $request): JsonResponse
    {
        $data    = $request->validate([
            'amount'      => 'nullable|numeric|min:0',
            'currency'    => 'nullable|string|in:USD,KHR',
            'bill_number' => 'nullable|string|max:25',
        ]);
        $account = AdminBankAccount::where('is_active', true)->first();

        if (!$account) {
            return response()->json(['message' => 'No platform bank account configured.'], 404);
        }

        $khqrString = $this->khqr->generate(
            phone:         $account->phone_number,
            merchantName:  $account->account_holder_name,
            amount:        isset($data['amount']) ? (float) $data['amount'] : null,
            currency:      $data['currency'] ?? 'USD',
            storeLabel:    'CamCart Platform',
            billNumber:    $data['bill_number'] ?? null,
            terminalLabel: 'Order Payment',
        );

        return response()->json([
            'khqr_string' => $khqrString,
            'md5'         => md5($khqrString),
        ]);
    }
}
