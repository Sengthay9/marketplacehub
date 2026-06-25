<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\Notification\NotificationService;
use Illuminate\Console\Command;

class LiftExpiredProductSuspensions extends Command
{
    protected $signature   = 'products:lift-suspensions';
    protected $description = 'Restore products whose suspension period has ended';

    public function __construct(private readonly NotificationService $notificationService)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $expired = Product::with('shop.owner')
            ->where('status', 'suspended')
            ->whereNotNull('suspended_until')
            ->where('suspended_until', '<=', now())
            ->get();

        foreach ($expired as $product) {
            $product->update([
                'status'          => 'inactive',
                'suspended_until' => null,
                'warning_reason'  => null,
            ]);

            if ($product->shop?->owner) {
                $this->notificationService->send($product->shop->owner, 'product_suspension_lifted', [
                    'title'   => 'Product Suspension Lifted',
                    'message' => "Your product '{$product->name}' suspension has ended. You can now activate it again.",
                    'data'    => ['product_id' => $product->id],
                ]);
            }
        }

        $this->info("Lifted {$expired->count()} product suspension(s).");
    }
}
