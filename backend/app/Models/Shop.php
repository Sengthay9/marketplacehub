<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\VendorPaymentQrCode;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Shop extends Model
{
    use HasFactory, HasSlug, SoftDeletes;

    protected $fillable = [
        'user_id', 'name', 'slug', 'logo', 'banner', 'description',
        'contact_number', 'email', 'address', 'rating', 'review_count',
        'status', 'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'rating'       => 'decimal:2',
            'review_count' => 'integer',
        ];
    }

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()->generateSlugsFrom('name')->saveSlugsTo('slug');
    }

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isSuspended(): bool { return $this->status === 'suspended'; }

    public function owner(): BelongsTo          { return $this->belongsTo(User::class, 'user_id'); }
    public function products(): HasMany         { return $this->hasMany(Product::class); }
    public function orders(): HasMany           { return $this->hasMany(Order::class); }
    public function coupons(): HasMany          { return $this->hasMany(Coupon::class); }
    public function paymentQrCodes(): HasMany   { return $this->hasMany(VendorPaymentQrCode::class); }
}
