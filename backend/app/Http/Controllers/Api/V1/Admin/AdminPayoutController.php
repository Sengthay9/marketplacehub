<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPayoutController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $payouts = Payout::with(['shop:id,name,slug', 'order:id,order_number,created_at'])
            ->when($request->status,  fn ($q) => $q->where('status', $request->status))
            ->when($request->shop_id, fn ($q) => $q->where('shop_id', $request->shop_id))
            ->latest()
            ->paginate(20);

        return response()->json($payouts);
    }

    public function summary(): JsonResponse
    {
        return response()->json([
            'pending_payout'   => Payout::where('status', 'pending')->sum('vendor_amount'),
            'completed_payout' => Payout::where('status', 'completed')->sum('vendor_amount'),
            'total_fee'        => Payout::sum('platform_fee'),
            'pending_count'    => Payout::where('status', 'pending')->count(),
        ]);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reference' => 'required|string|max:100',
            'notes'     => 'nullable|string|max:500',
        ]);

        $payout = Payout::with('shop.user')->findOrFail($id);

        if ($payout->status !== 'pending') {
            return response()->json(['message' => 'Payout already completed or failed.'], 400);
        }

        $payout->update([
            'status'       => 'completed',
            'reference'    => $request->reference,
            'notes'        => $request->notes,
            'processed_at' => now(),
        ]);

        // Notify vendor
        if ($payout->shop?->user) {
            $this->notificationService->send($payout->shop->user, 'payout_completed', [
                'title'   => 'Payout Transferred',
                'message' => 'Your payout of $' . number_format($payout->vendor_amount, 2) . ' for order #' . ($payout->order?->order_number ?? $payout->order_id) . ' has been transferred to your account.',
                'data'    => [
                    'payout_id'     => $payout->id,
                    'order_id'      => $payout->order_id,
                    'order_number'  => $payout->order?->order_number,
                    'vendor_amount' => $payout->vendor_amount,
                    'reference'     => $request->reference,
                ],
            ]);
        }

        return response()->json(['message' => 'Payout completed.', 'payout' => $payout]);
    }

    public function bulkComplete(Request $request): JsonResponse
    {
        $request->validate([
            'ids'       => 'required|array',
            'ids.*'     => 'integer|exists:payouts,id',
            'reference' => 'required|string|max:100',
        ]);

        $payouts = Payout::with(['shop.user', 'order:id,order_number'])
            ->whereIn('id', $request->ids)
            ->where('status', 'pending')
            ->get();

        foreach ($payouts as $payout) {
            $payout->update([
                'status'       => 'completed',
                'reference'    => $request->reference,
                'processed_at' => now(),
            ]);

            if ($payout->shop?->user) {
                $this->notificationService->send($payout->shop->user, 'payout_completed', [
                    'title'   => 'Payout Transferred',
                    'message' => 'Your payout of $' . number_format($payout->vendor_amount, 2) . ' for order #' . ($payout->order?->order_number ?? $payout->order_id) . ' has been transferred to your account.',
                    'data'    => [
                        'payout_id'     => $payout->id,
                        'order_id'      => $payout->order_id,
                        'order_number'  => $payout->order?->order_number,
                        'vendor_amount' => $payout->vendor_amount,
                        'reference'     => $request->reference,
                    ],
                ]);
            }
        }

        return response()->json(['message' => "{$payouts->count()} payout(s) marked as completed."]);
    }
}
