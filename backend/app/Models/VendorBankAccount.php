<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorBankAccount extends Model
{
    protected $fillable = [
        'shop_id', 'bank_name', 'account_holder_name',
        'account_number', 'phone_number', 'is_primary', 'khqr_string', 'qr_image_path',
    ];

    public function qrImageUrl(): ?string
    {
        return $this->qr_image_path
            ? \Illuminate\Support\Facades\Storage::url($this->qr_image_path)
            : null;
    }

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}
