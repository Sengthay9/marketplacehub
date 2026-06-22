<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShopReview extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'shop_id', 'user_id', 'order_id', 'rating', 'comment',
        'vendor_reply', 'vendor_replied_at',
    ];

    protected function casts(): array
    {
        return [
            'rating'            => 'integer',
            'vendor_replied_at' => 'datetime',
        ];
    }

    public function shop(): BelongsTo  { return $this->belongsTo(Shop::class); }
    public function user(): BelongsTo  { return $this->belongsTo(User::class); }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
}
