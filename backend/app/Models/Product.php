<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Product extends Model
{
    use HasFactory, HasSlug, SoftDeletes;

    protected $fillable = [
        'shop_id', 'category_id', 'name', 'slug', 'sku', 'description',
        'price', 'discount_price', 'stock_quantity', 'rating', 'review_count',
        'status', 'rejection_reason', 'is_featured', 'sold_count',
        'warning_reason',
    ];

    protected $appends = ['effective_price', 'is_in_stock'];

    protected function casts(): array
    {
        return [
            'price'          => 'float',
            'discount_price' => 'float',
            'rating'         => 'float',
            'is_featured'    => 'boolean',
        ];
    }

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()->generateSlugsFrom('name')->saveSlugsTo('slug');
    }

    public function getEffectivePriceAttribute(): float
    {
        return (float) ($this->discount_price ?? $this->price);
    }

    public function getIsInStockAttribute(): bool
    {
        return $this->stock_quantity > 0;
    }

    public function isPublished(): bool { return $this->status === 'published'; }
    public function isPending(): bool   { return $this->status === 'pending'; }

    public function shop(): BelongsTo         { return $this->belongsTo(Shop::class); }
    public function category(): BelongsTo     { return $this->belongsTo(Category::class); }
    public function variants(): HasMany       { return $this->hasMany(ProductVariant::class); }
    public function images(): HasMany         { return $this->hasMany(ProductImage::class)->orderBy('sort_order'); }
    public function primaryImage(): HasMany   { return $this->hasMany(ProductImage::class)->where('is_primary', true); }
    public function inventory(): HasMany      { return $this->hasMany(Inventory::class); }
    public function reviews(): HasMany        { return $this->hasMany(Review::class); }
    public function wishlistItems(): HasMany  { return $this->hasMany(WishlistItem::class); }
    public function cartItems(): HasMany      { return $this->hasMany(CartItem::class); }
    public function orderItems(): HasMany     { return $this->hasMany(OrderItem::class); }
}
