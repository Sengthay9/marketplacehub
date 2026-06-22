<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_payment_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->string('bank_name');          // 'aba', 'bakong', 'acleda', 'wing', 'truemoney', etc.
            $table->string('bank_label');         // "ABA Pay", "Bakong KHQR", etc.
            $table->enum('currency', ['usd', 'khr'])->default('usd');
            $table->string('qr_image_path');      // stored file path
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_payment_qr_codes');
    }
};
