<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id', 'code', 'description', 'type', 'value',
        'min_order_amount', 'max_discount', 'usage_limit', 'usage_limit_per_user', 'used_count',
        'new_customers_only', 'starts_at', 'expires_at', 'is_active', 'fully_used_at',
    ];

    protected function casts(): array
    {
        return [
            'value'             => 'decimal:2',
            'min_order_amount'  => 'decimal:2',
            'max_discount'      => 'decimal:2',
            'starts_at'         => 'datetime',
            'expires_at'        => 'datetime',
            'fully_used_at'     => 'datetime',
            'new_customers_only' => 'boolean',
            'is_active'          => 'boolean',
        ];
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->starts_at && now()->lt($this->starts_at)) return false;
        if ($this->expires_at && now()->gt($this->expires_at)) return false;
        if ($this->usage_limit && $this->used_count >= $this->usage_limit) return false;
        return true;
    }

    public function calculateDiscount(float $orderTotal): float
    {
        if ($orderTotal < $this->min_order_amount) return 0.0;

        $discount = $this->type === 'percentage'
            ? ($orderTotal * $this->value / 100)
            : $this->value;

        if ($this->max_discount) {
            $discount = min($discount, $this->max_discount);
        }

        return round(min($discount, $orderTotal), 2);
    }

    public function shop(): BelongsTo    { return $this->belongsTo(Shop::class); }
    public function usages(): HasMany    { return $this->hasMany(CouponUsage::class); }
}
