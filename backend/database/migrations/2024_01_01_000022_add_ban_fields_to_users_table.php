<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('ban_type')->nullable()->after('role'); // warn | suspend | ban
            $table->text('ban_reason')->nullable()->after('ban_type');
            $table->timestamp('banned_until')->nullable()->after('ban_reason'); // null = permanent
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ban_type', 'ban_reason', 'banned_until']);
        });
    }
};
