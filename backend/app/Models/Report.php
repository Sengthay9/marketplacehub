<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Report extends Model
{
    protected $fillable = [
        'reporter_id', 'reportable_type', 'reportable_id', 'subject',
        'reason', 'description', 'status', 'is_read', 'admin_note',
        'admin_reply', 'replied_at', 'resolved_by', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'replied_at'  => 'datetime',
            'is_read'     => 'boolean',
        ];
    }

    public function reporter(): BelongsTo  { return $this->belongsTo(User::class, 'reporter_id'); }
    public function resolver(): BelongsTo  { return $this->belongsTo(User::class, 'resolved_by'); }
    public function reportable(): MorphTo  { return $this->morphTo(); }
}
