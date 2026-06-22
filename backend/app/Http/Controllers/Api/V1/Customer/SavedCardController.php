<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\SavedCard;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavedCardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cards = $request->user()
            ->savedCards()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($c) => $c->toSafeArray());

        return response()->json(['data' => $cards]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'card_number'      => 'required|string|min:13|max:19',
            'card_holder_name' => 'required|string|max:100',
            'expiry_month'     => 'required|string|size:2',
            'expiry_year'      => 'required|string|size:4',
            'set_default'      => 'boolean',
            // CVV is validated client-side only — never sent to server for storage
        ]);

        $raw    = preg_replace('/\D/', '', $request->card_number);
        $last4  = substr($raw, -4);
        $brand  = $this->detectBrand($raw);

        // Prevent duplicate cards
        $exists = $request->user()->savedCards()
            ->where('card_last_four', $last4)
            ->where('expiry_month', $request->expiry_month)
            ->where('expiry_year', $request->expiry_year)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'This card is already saved.'], 409);
        }

        DB::transaction(function () use ($request, $raw, $last4, $brand) {
            if ($request->boolean('set_default')) {
                $request->user()->savedCards()->update(['is_default' => false]);
            }

            $card = SavedCard::create([
                'user_id'          => $request->user()->id,
                'card_holder_name' => trim($request->card_holder_name),
                'card_last_four'   => $last4,
                'card_brand'       => $brand,
                'expiry_month'     => $request->expiry_month,
                'expiry_year'      => $request->expiry_year,
                'encrypted_number' => $raw,
                'is_default'       => $request->boolean('set_default'),
            ]);

            AuditLog::record('card:saved', [
                'user_id'    => $request->user()->id,
                'new_values' => ['last_four' => $last4, 'brand' => $brand],
            ]);
        });

        return response()->json(['message' => 'Card saved securely.'], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $card = $request->user()->savedCards()->findOrFail($id);
        $card->delete();

        AuditLog::record('card:deleted', [
            'user_id'    => $request->user()->id,
            'new_values' => ['last_four' => $card->card_last_four],
        ]);

        return response()->json(['message' => 'Card removed.']);
    }

    public function setDefault(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $user->savedCards()->update(['is_default' => false]);
        $user->savedCards()->findOrFail($id)->update(['is_default' => true]);

        return response()->json(['message' => 'Default card updated.']);
    }

    private function detectBrand(string $number): string
    {
        if (preg_match('/^4/', $number))                          return 'visa';
        if (preg_match('/^5[1-5]/', $number))                     return 'mastercard';
        if (preg_match('/^3[47]/', $number))                      return 'amex';
        if (preg_match('/^6(?:011|5)/', $number))                 return 'discover';
        if (preg_match('/^(?:2131|1800|35\d{3})/', $number))      return 'jcb';
        return 'unknown';
    }
}
