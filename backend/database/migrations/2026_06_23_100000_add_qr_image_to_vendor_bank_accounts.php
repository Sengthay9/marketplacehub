<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_bank_accounts', function (Blueprint $table) {
            $table->string('qr_image_path')->nullable()->after('khqr_string');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_bank_accounts', function (Blueprint $table) {
            $table->dropColumn('qr_image_path');
        });
    }
};
