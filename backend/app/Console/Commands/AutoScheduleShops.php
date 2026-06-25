<?php

namespace App\Console\Commands;

use App\Models\Shop;
use Illuminate\Console\Command;

class AutoScheduleShops extends Command
{
    protected $signature   = 'shops:auto-schedule';
    protected $description = 'Auto open/close shops based on their configured open and close times';

    public function handle(): void
    {
        $now = now()->format('H:i');

        Shop::whereNotNull('open_time')
            ->whereNotNull('close_time')
            ->where('status', 'approved')
            ->each(function (Shop $shop) use ($now) {
                $open  = substr($shop->open_time,  0, 5);
                $close = substr($shop->close_time, 0, 5);

                // Support overnight schedules (e.g. 22:00 – 02:00)
                if ($open <= $close) {
                    $shouldBeOpen = $now >= $open && $now < $close;
                } else {
                    $shouldBeOpen = $now >= $open || $now < $close;
                }

                if ($shop->is_open !== $shouldBeOpen) {
                    $shop->update(['is_open' => $shouldBeOpen]);
                }
            });
    }
}
