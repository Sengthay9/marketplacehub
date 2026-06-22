<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_commissions', function (Blueprint $table) {
            $table->timestamp('invoice_sent_at')->nullable()->after('paid_at');
            $table->string('invoice_number')->nullable()->after('invoice_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('shop_commissions', function (Blueprint $table) {
            $table->dropColumn(['invoice_sent_at', 'invoice_number']);
        });
    }
};
