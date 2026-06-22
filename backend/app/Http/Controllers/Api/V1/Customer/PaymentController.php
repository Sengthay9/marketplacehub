<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SavedCard;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Get payment status for an order (used by frontend to poll QR payment).
     */
    public function status(Request $request, int $orderId): JsonResponse
    {
        $order = Order::where('user_id', $request->user()->id)
            ->with('payment')
            ->findOrFail($orderId);

        return response()->json([
            'status'  => $order->payment?->status ?? 'pending',
            'gateway' => $order->payment?->gateway ?? 'unknown',
        ]);
    }

    /**
     * Confirm a QR/card payment after the user completes it.
     * In production this would be triggered by a payment gateway webhook.
     */
    public function confirm(Request $request, int $orderId): JsonResponse
    {
        $request->validate([
            'gateway'        => 'required|in:aba,bakong,acleda,card',
            'transaction_ref'=> 'nullable|string|max:100',
            'saved_card_id'  => 'nullable|integer|exists:saved_cards,id',
        ]);

        $order = Order::where('user_id', $request->user()->id)
            ->with('payment')
            ->findOrFail($orderId);

        if ($order->payment && $order->payment->status === 'completed') {
            return response()->json(['message' => 'Payment already completed.', 'status' => 'completed']);
        }

        // Verify saved card belongs to user
        if ($request->saved_card_id) {
            $card = $request->user()->savedCards()->findOrFail($request->saved_card_id);
        }

        $transactionRef = $request->transaction_ref ?? Str::upper(Str::random(12));

        if ($order->payment) {
            $order->payment->update([
                'status'         => 'completed',
                'gateway'        => $request->gateway,
                'transaction_id' => $transactionRef,
                'metadata'       => [
                    'confirmed_at'  => now()->toIso8601String(),
                    'saved_card_id' => $request->saved_card_id ?? null,
                ],
            ]);
        } else {
            Payment::create([
                'order_id'       => $order->id,
                'gateway'        => $request->gateway,
                'amount'         => $order->total,
                'status'         => 'completed',
                'transaction_id' => $transactionRef,
            ]);
        }

        AuditLog::record('payment:confirmed', [
            'user_id'    => $request->user()->id,
            'new_values' => [
                'order_id' => $orderId,
                'gateway'  => $request->gateway,
                'ref'      => $transactionRef,
            ],
        ]);

        return response()->json([
            'message'         => 'Payment confirmed.',
            'status'          => 'completed',
            'transaction_ref' => $transactionRef,
        ]);
    }
}
