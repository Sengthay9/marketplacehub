<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'sku', 'attributes', 'price', 'discount_price',
        'stock_quantity', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'attributes'     => 'array',
            'price'          => 'decimal:2',
            'discount_price' => 'decimal:2',
            'is_active'      => 'boolean',
        ];
    }

    public function getAttributeLabelAttribute(): string
    {
        return implode(' / ', array_values($this->attributes ?? []));
    }

    public function getEffectivePriceAttribute(): float
    {
        return $this->discount_price ?? $this->price ?? $this->product->effective_price;
    }

    public function product(): BelongsTo  { return $this->belongsTo(Product::class); }
    public function inventory(): HasOne   { return $this->hasOne(Inventory::class, 'variant_id'); }
}
