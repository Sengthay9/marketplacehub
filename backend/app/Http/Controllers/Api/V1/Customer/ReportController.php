<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Report;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private const ORDER_COMPLAINT_REASONS = [
        'not_received', 'missing_item', 'wrong_order', 'broken_product',
    ];

    private const ORDER_COMPLAINT_TITLES = [
        'not_received'   => 'Order Not Received',
        'missing_item'   => 'Missing Items in Order',
        'wrong_order'    => 'Wrong Order Delivered',
        'broken_product' => 'Product Arrived Damaged',
    ];

    public function __construct(private readonly NotificationService $notificationService) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reportable_type' => 'nullable|in:product,shop,user,order',
            'reportable_id'   => 'nullable|integer',
            'subject'         => 'nullable|string|max:200',
            'reason'          => 'required|in:fraud,spam,inappropriate,misleading,scam,poor_quality,support,question,feedback,not_received,missing_item,wrong_order,broken_product,other',
            'description'     => 'required|string|min:5|max:2000',
        ]);

        $typeMap = [
            'product' => \App\Models\Product::class,
            'shop'    => \App\Models\Shop::class,
            'user'    => \App\Models\User::class,
            'order'   => \App\Models\Order::class,
        ];

        $report = Report::create([
            'reporter_id'     => $request->user()->id,
            'reportable_type' => isset($data['reportable_type']) ? $typeMap[$data['reportable_type']] : null,
            'reportable_id'   => $data['reportable_id'] ?? null,
            'subject'         => $data['subject'] ?? null,
            'reason'          => $data['reason'],
            'description'     => $data['description'],
            'status'          => 'pending',
        ]);

        // Notify the vendor when customer files an order complaint
        if (
            in_array($data['reason'], self::ORDER_COMPLAINT_REASONS) &&
            ($data['reportable_type'] ?? null) === 'order' &&
            ! empty($data['reportable_id'])
        ) {
            $order = Order::with('shop.user')->find($data['reportable_id']);

            if ($order?->shop?->user) {
                $this->notificationService->send($order->shop->user, 'order_complaint_' . $data['reason'], [
                    'title'   => self::ORDER_COMPLAINT_TITLES[$data['reason']],
                    'message' => $data['description'],
                    'data'    => [
                        'order_id'      => $order->id,
                        'order_number'  => $order->order_number,
                        'report_id'     => $report->id,
                        'customer_name' => $request->user()->name,
                        'reason'        => $data['reason'],
                    ],
                ]);
            }
        }

        return response()->json(['message' => 'Message sent to admin.', 'report' => $report], 201);
    }

    public function myReports(Request $request): JsonResponse
    {
        $reports = Report::where('reporter_id', $request->user()->id)
            ->latest()
            ->paginate(10);
        return response()->json($reports);
    }
}
