<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class VendorPaymentQrCode extends Model
{
    protected $fillable = [
        'shop_id', 'bank_name', 'bank_label', 'currency',
        'qr_image_path', 'account_name', 'account_number', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function getQrImageUrlAttribute(): string
    {
        return Storage::url($this->qr_image_path);
    }

    public function toPublicArray(): array
    {
        return [
            'id'             => $this->id,
            'bank_name'      => $this->bank_name,
            'bank_label'     => $this->bank_label,
            'currency'       => $this->currency,
            'qr_image_url'   => $this->qr_image_url,
            'account_name'   => $this->account_name,
            'account_number' => $this->account_number,
        ];
    }
}
