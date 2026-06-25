<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('bank_name', 60)->default('Bakong');
            $table->string('account_holder_name', 150);
            $table->string('account_number', 60)->nullable();
            $table->string('phone_number', 30);
            $table->text('khqr_string')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_bank_accounts');
    }
};
