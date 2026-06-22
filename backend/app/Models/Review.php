<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Review extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id', 'user_id', 'order_id', 'rating', 'comment',
        'images', 'vendor_reply', 'vendor_replied_at',
    ];

    protected function casts(): array
    {
        return [
            'images'            => 'array',
            'vendor_replied_at' => 'datetime',
            'rating'            => 'integer',
        ];
    }

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function user(): BelongsTo    { return $this->belongsTo(User::class); }
    public function order(): BelongsTo   { return $this->belongsTo(Order::class); }
}
