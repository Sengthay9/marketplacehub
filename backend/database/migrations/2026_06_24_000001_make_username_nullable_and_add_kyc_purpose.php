<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->change();
        });

        Schema::table('vendor_kyc', function (Blueprint $table) {
            $table->text('purpose')->nullable()->after('province');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();
        });
        Schema::table('vendor_kyc', function (Blueprint $table) {
            $table->dropColumn('purpose');
        });
    }
};
