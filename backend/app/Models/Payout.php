<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    protected $fillable = [
        'order_id', 'shop_id', 'gross_amount', 'platform_fee',
        'vendor_amount', 'status', 'reference', 'processed_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount'  => 'decimal:2',
            'platform_fee'  => 'decimal:2',
            'vendor_amount' => 'decimal:2',
            'processed_at'  => 'datetime',
        ];
    }

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function shop(): BelongsTo  { return $this->belongsTo(Shop::class); }
}
