<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopCommission extends Model
{
    protected $fillable = [
        'shop_id', 'order_id', 'year', 'month', 'cycle', 'period_start', 'period_end',
        'gross_revenue', 'commission_rate', 'commission_amount',
        'status', 'paid_at', 'invoice_sent_at', 'invoice_number',
    ];

    protected function casts(): array
    {
        return [
            'gross_revenue'    => 'float',
            'commission_rate'  => 'float',
            'commission_amount'=> 'float',
            'paid_at'          => 'datetime',
            'invoice_sent_at'  => 'datetime',
            'period_start'     => 'datetime',
            'period_end'       => 'datetime',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function isPending(): bool { return $this->status === 'pending'; }
    public function isPaid(): bool    { return $this->status === 'paid'; }
}
