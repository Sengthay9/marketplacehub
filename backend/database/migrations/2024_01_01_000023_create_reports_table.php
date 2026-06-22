<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('reportable_type'); // App\Models\Product | Shop | User | Order
            $table->unsignedBigInteger('reportable_id');
            $table->string('subject')->nullable(); // name/title of what is being reported
            $table->string('reason');   // fraud | spam | inappropriate | misleading | scam | other
            $table->text('description');
            $table->string('status')->default('pending'); // pending | reviewing | resolved | dismissed
            $table->text('admin_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['reportable_type', 'reportable_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
