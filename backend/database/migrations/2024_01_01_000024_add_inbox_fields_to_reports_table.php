<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->boolean('is_read')->default(false)->after('status');
            $table->text('admin_reply')->nullable()->after('admin_note');
            $table->timestamp('replied_at')->nullable()->after('admin_reply');
            // Make reportable polymorphic nullable so plain messages work too
            $table->string('reportable_type')->nullable()->change();
            $table->unsignedBigInteger('reportable_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['is_read', 'admin_reply', 'replied_at']);
        });
    }
};
