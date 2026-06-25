<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_bank_accounts', function (Blueprint $table) {
            $table->text('khqr_string')->nullable()->after('is_primary');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_bank_accounts', function (Blueprint $table) {
            $table->dropColumn('khqr_string');
        });
    }
};
