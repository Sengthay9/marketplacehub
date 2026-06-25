<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_commissions', function (Blueprint $table) {
            $table->foreignId('order_id')->nullable()->unique()->constrained('orders')->nullOnDelete()->after('shop_id');
        });
    }

    public function down(): void
    {
        Schema::table('shop_commissions', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropColumn('order_id');
        });
    }
};
