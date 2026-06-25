<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = [
        'user_id', 'label', 'recipient_name', 'phone',
        'street', 'city', 'state', 'postal_code', 'country', 'is_default',
        'latitude', 'longitude',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'latitude'   => 'float',
            'longitude'  => 'float',
        ];
    }

    public function getFullAddressAttribute(): string
    {
        return implode(', ', array_filter([
            $this->street, $this->city, $this->state,
            $this->postal_code, $this->country,
        ]));
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
