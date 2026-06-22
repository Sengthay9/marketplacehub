<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_commissions', function (Blueprint $table) {
            $table->unsignedInteger('cycle')->nullable()->after('shop_id');
            $table->timestamp('period_start')->nullable()->after('month');
            $table->timestamp('period_end')->nullable()->after('period_start');

            // Unique constraint: one record per shop per 30-day cycle
            $table->unique(['shop_id', 'cycle'], 'shop_commissions_shop_cycle_unique');
        });
    }

    public function down(): void
    {
        Schema::table('shop_commissions', function (Blueprint $table) {
            $table->dropUnique('shop_commissions_shop_cycle_unique');
            $table->dropColumn(['cycle', 'period_start', 'period_end']);
        });
    }
};
