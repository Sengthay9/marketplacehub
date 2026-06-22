<?php

namespace App\Jobs;

use App\Models\Inventory;
use App\Services\Notification\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendLowStockAlert implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $inventoryId) {}

    public function handle(NotificationService $notificationService): void
    {
        $inventory = Inventory::with(['product.shop.owner'])->find($this->inventoryId);

        if (!$inventory || !$inventory->product?->shop?->owner) return;

        $notificationService->send(
            $inventory->product->shop->owner,
            'low_stock',
            [
                'title'   => 'Low Stock Alert',
                'message' => "'{$inventory->product->name}' is running low ({$inventory->quantity} remaining).",
                'data'    => [
                    'product_id'  => $inventory->product_id,
                    'product_name'=> $inventory->product->name,
                    'quantity'    => $inventory->quantity,
                ],
            ]
        );
    }
}
