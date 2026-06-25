<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorPayoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shop = Shop::where('user_id', $request->user()->id)->firstOrFail();

        $payouts = Payout::with('order:id,order_number,created_at')
            ->where('shop_id', $shop->id)
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        $summary = Payout::where('shop_id', $shop->id)->selectRaw('
            SUM(vendor_amount)                                    as total_earned,
            SUM(CASE WHEN status = ? THEN vendor_amount ELSE 0 END) as pending_amount,
            SUM(CASE WHEN status = ? THEN vendor_amount ELSE 0 END) as completed_amount,
            SUM(platform_fee)                                     as total_fee_paid,
            COUNT(*)                                              as total_payouts
        ', ['pending', 'completed'])->first();

        return response()->json([
            'payouts' => $payouts,
            'summary' => $summary,
        ]);
    }
}
