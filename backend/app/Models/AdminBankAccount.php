<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminBankAccount extends Model
{
    protected $fillable = [
        'bank_name', 'account_holder_name', 'account_number',
        'phone_number', 'khqr_string', 'is_active', 'bakong_transfer_token',
    ];

    protected $hidden = ['bakong_transfer_token'];

    protected function casts(): array
    {
        return [
            'is_active'             => 'boolean',
            'bakong_transfer_token' => 'encrypted',
        ];
    }

    public function hasTransferToken(): bool
    {
        return !empty($this->bakong_transfer_token);
    }
}
