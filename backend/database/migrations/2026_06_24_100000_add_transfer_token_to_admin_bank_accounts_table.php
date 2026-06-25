<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_bank_accounts', function (Blueprint $table) {
            $table->text('bakong_transfer_token')->nullable()->after('khqr_string');
        });
    }

    public function down(): void
    {
        Schema::table('admin_bank_accounts', function (Blueprint $table) {
            $table->dropColumn('bakong_transfer_token');
        });
    }
};
