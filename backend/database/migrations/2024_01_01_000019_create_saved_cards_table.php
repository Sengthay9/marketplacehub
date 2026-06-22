<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('card_holder_name');
            $table->string('card_last_four', 4);
            $table->string('card_brand', 20);   // visa, mastercard, amex, etc.
            $table->string('expiry_month', 2);
            $table->string('expiry_year', 4);
            // Full card number encrypted with AES-256. CVV is NEVER stored.
            $table->text('encrypted_number');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_cards');
    }
};
