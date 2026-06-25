<?php

use Illuminate\Support\Facades\Schedule;

// Commission is now recorded per-order via PaymentObserver when payment is confirmed
// Schedule::command('commissions:auto-calculate')->dailyAt('00:00');

// Check every hour and restore products whose suspension has expired
Schedule::command('products:lift-suspensions')->hourly();

// Auto open/close shops based on their configured schedule (every minute)
Schedule::command('shops:auto-schedule')->everyMinute();
