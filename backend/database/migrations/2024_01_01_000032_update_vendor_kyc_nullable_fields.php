<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_kyc', function (Blueprint $table) {
            $table->string('id_number')->nullable()->change();
            $table->string('city')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vendor_kyc', function (Blueprint $table) {
            $table->string('id_number')->nullable(false)->change();
            $table->string('city')->nullable(false)->change();
        });
    }
};
