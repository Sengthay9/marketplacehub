<?php

use Illuminate\Support\Facades\Schedule;

// Runs every day at midnight — internally checks which shops have hit their 30-day cycle
Schedule::command('commissions:auto-calculate')->dailyAt('00:00');
