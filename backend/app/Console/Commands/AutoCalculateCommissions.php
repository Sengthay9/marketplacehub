<?php

namespace App\Console\Commands;

use App\Models\Shop;
use App\Models\ShopCommission;
use App\Models\Order;
use App\Services\Notification\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoCalculateCommissions extends Command
{
    protected $signature   = 'commissions:auto-calculate';
    protected $description = 'Auto-calculate 15% commission for each shop every 30 days from their join date.';

    private const RATE = 0.05;

    public function handle(NotificationService $notifications): void
    {
        $today  = now()->startOfDay();
        $shops  = Shop::with('owner')->where('status', 'approved')->get();
        $count  = 0;

        foreach ($shops as $shop) {
            $anchor = $shop->created_at->startOfDay();

            // How many full 30-day cycles have elapsed since shop creation?
            $daysSince = $anchor->diffInDays($today);
            $cycles    = (int) floor($daysSince / 30);

            if ($cycles < 1) {
                continue; // Shop not yet 30 days old
            }

            // The most recent cycle's period
            $periodStart = $anchor->copy()->addDays(($cycles - 1) * 30);
            $periodEnd   = $anchor->copy()->addDays($cycles * 30)->subSecond();

            // Use a unique key per shop+cycle so we don't double-calculate
            $cycleKey = $cycles; // cycle number (1 = first 30 days, 2 = second, …)

            $existing = ShopCommission::where('shop_id', $shop->id)
                ->where('cycle', $cycleKey)
                ->first();

            if ($existing) {
                continue; // Already calculated for this cycle
            }

            // Sum delivered orders in this 30-day window
            $gross = Order::where('shop_id', $shop->id)
                ->where('status', 'delivered')
                ->whereBetween('delivered_at', [$periodStart, $periodEnd])
                ->sum('total');

            $commission = round($gross * self::RATE, 2);

            ShopCommission::create([
                'shop_id'           => $shop->id,
                'year'              => $periodEnd->year,
                'month'             => $periodEnd->month,
                'cycle'             => $cycleKey,
                'period_start'      => $periodStart,
                'period_end'        => $periodEnd,
                'gross_revenue'     => $gross,
                'commission_rate'   => self::RATE,
                'commission_amount' => $commission,
                'status'            => 'pending',
            ]);

            // Notify vendor
            try {
                $notifications->send($shop->owner, 'commission_due', [
                    'title'   => 'Commission Invoice Due',
                    'message' => "Your 30-day commission of $" . number_format($commission, 2) . " (5% of \$$" . number_format($gross, 2) . " revenue) is now due to CamCart.",
                    'data'    => ['shop_id' => $shop->id, 'cycle' => $cycleKey],
                ]);
            } catch (\Throwable $e) {
                Log::warning("Commission notification failed for shop {$shop->id}: " . $e->getMessage());
            }

            $count++;
            $this->line("  ✓ Shop #{$shop->id} ({$shop->name}) — cycle {$cycleKey} — commission: \${$commission}");
        }

        $this->info("Done. Calculated {$count} new commission record(s).");
    }
}
