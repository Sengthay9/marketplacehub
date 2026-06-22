<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class SavedCard extends Model
{
    protected $fillable = [
        'user_id', 'card_holder_name', 'card_last_four',
        'card_brand', 'expiry_month', 'expiry_year',
        'encrypted_number', 'is_default',
    ];

    protected $hidden = [
        'encrypted_number',  // never expose raw encrypted data in JSON
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setEncryptedNumberAttribute(string $plainCardNumber): void
    {
        $this->attributes['encrypted_number'] = Crypt::encryptString($plainCardNumber);
    }

    public function getDecryptedNumber(): string
    {
        return Crypt::decryptString($this->attributes['encrypted_number']);
    }

    public function getMaskedNumber(): string
    {
        return '**** **** **** ' . $this->card_last_four;
    }

    public function toSafeArray(): array
    {
        return [
            'id'               => $this->id,
            'card_holder_name' => $this->card_holder_name,
            'card_last_four'   => $this->card_last_four,
            'card_brand'       => $this->card_brand,
            'expiry_month'     => $this->expiry_month,
            'expiry_year'      => $this->expiry_year,
            'masked_number'    => $this->getMaskedNumber(),
            'is_default'       => $this->is_default,
        ];
    }
}
