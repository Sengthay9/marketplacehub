<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\SavedCard;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Notifications\ResetPassword;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'username', 'email', 'password', 'phone', 'avatar', 'role',
        'email_verified', 'email_verified_at',
        'google_id',
        'two_factor_secret', 'two_factor_confirmed_at', 'two_factor_recovery_codes',
        'last_login_at', 'last_login_ip',
        'ban_type', 'ban_reason', 'banned_until',
    ];

    protected $hidden = [
        'password', 'remember_token',
        'two_factor_secret', 'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'two_factor_confirmed_at'  => 'datetime',
            'last_login_at'            => 'datetime',
            'banned_until'             => 'datetime',
            'email_verified'           => 'boolean',
            'password'                 => 'hashed',
        ];
    }

    public function isBannedOrSuspended(): bool
    {
        return $this->trashed();
    }

    public function isSuspensionExpired(): bool
    {
        return $this->ban_type === 'suspend'
            && $this->banned_until !== null
            && $this->banned_until->isPast();
    }

    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isVendor(): bool   { return $this->role === 'vendor'; }
    public function isCustomer(): bool { return $this->role === 'customer'; }

    public function hasTwoFactor(): bool
    {
        return (bool) $this->two_factor_confirmed_at;
    }

    public function shop(): HasOne        { return $this->hasOne(Shop::class); }
    public function orders(): HasMany     { return $this->hasMany(Order::class); }
    public function reviews(): HasMany    { return $this->hasMany(Review::class); }
    public function addresses(): HasMany  { return $this->hasMany(Address::class); }
    public function wishlist(): HasOne    { return $this->hasOne(Wishlist::class); }
    public function cart(): HasOne        { return $this->hasOne(Cart::class); }
    public function auditLogs(): HasMany  { return $this->hasMany(AuditLog::class); }
    public function savedCards(): HasMany  { return $this->hasMany(SavedCard::class); }

    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    // Send the password reset link to the frontend reset page, not the Laravel default
    public function sendPasswordResetNotification($token): void
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost');
        $url = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($this->email);

        ResetPassword::createUrlUsing(fn () => $url);
        $this->notify(new ResetPassword($token));
    }
}
