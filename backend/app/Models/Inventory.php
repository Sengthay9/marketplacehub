<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    public $timestamps = false;

    protected $fillable = ['product_id', 'variant_id', 'quantity', 'low_stock_threshold', 'last_updated'];

    protected function casts(): array
    {
        return ['last_updated' => 'datetime'];
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->low_stock_threshold && $this->quantity > 0;
    }

    public function isOutOfStock(): bool
    {
        return $this->quantity === 0;
    }

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
