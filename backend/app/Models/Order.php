<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', 'user_id', 'shop_id', 'address_id', 'coupon_id',
        'subtotal', 'discount_amount', 'tax_amount', 'platform_fee', 'total',
        'status', 'notes',
        'confirmed_at', 'delivered_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'        => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount'      => 'decimal:2',
            'platform_fee'    => 'decimal:2',
            'total'           => 'decimal:2',
            'confirmed_at'    => 'datetime',
            'delivered_at'    => 'datetime',
            'cancelled_at'    => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (Order $order) {
            $order->order_number ??= 'ORD-' . strtoupper(uniqid());
        });
    }

    public function isPending(): bool    { return $this->status === 'pending'; }
    public function isDelivered(): bool  { return $this->status === 'delivered'; }
    public function isCancellable(): bool {
        return in_array($this->status, ['pending', 'confirmed']);
    }

    public function customer(): BelongsTo  { return $this->belongsTo(User::class, 'user_id'); }
    public function shop(): BelongsTo      { return $this->belongsTo(Shop::class); }
    public function address(): BelongsTo   { return $this->belongsTo(Address::class); }
    public function coupon(): BelongsTo    { return $this->belongsTo(Coupon::class); }
    public function items(): HasMany       { return $this->hasMany(OrderItem::class); }
    public function payment(): HasOne      { return $this->hasOne(Payment::class); }
    public function couponUsage(): HasOne  { return $this->hasOne(CouponUsage::class); }
}
