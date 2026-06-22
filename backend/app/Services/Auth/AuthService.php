<?php

namespace App\Services\Auth;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Wishlist;
use App\Models\Cart;
use App\Notifications\WelcomeNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name'           => $data['name'],
            'username'       => $data['username'],
            'email'          => $data['email'],
            'password'       => $data['password'],
            'phone'          => $data['phone'] ?? null,
            'role'           => $data['role'] ?? 'customer',
            'email_verified' => false,
        ]);

        if ($user->isCustomer()) {
            Wishlist::create(['user_id' => $user->id]);
            Cart::create(['user_id' => $user->id]);
        }

        $user->notify(new WelcomeNotification());
        $user->notify(new VerifyEmailNotification());

        AuditLog::record('auth:register', [
            'user_id'    => $user->id,
            'new_values' => ['email' => $user->email, 'role' => $user->role],
        ]);

        return [
            'message'         => 'Account created. Please check your email to verify your account.',
            'email_sent_to'   => $user->email,
            'requires_verify' => true,
        ];
    }

    public function login(string $identifier, string $password): array
    {
        // Check soft-deleted users too so we can give a proper ban message
        $user = User::withTrashed()
                    ->where('email', $identifier)
                    ->orWhere(fn ($q) => $q->where('username', $identifier))
                    ->orWhere(fn ($q) => $q->where('phone', $identifier))
                    ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            AuditLog::record('auth:login_failed', [
                'new_values' => ['identifier' => $identifier],
                'ip_address' => request()->ip(),
            ]);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Auto-lift expired temporary suspensions
        if ($user->trashed() && $user->isSuspensionExpired()) {
            $user->restore();
            $user->update(['ban_type' => null, 'ban_reason' => null, 'banned_until' => null]);
        }

        if ($user->trashed()) {
            $message = $user->ban_type === 'ban'
                ? 'Your account has been permanently banned. Reason: ' . ($user->ban_reason ?? 'violation of terms.')
                : 'Your account is suspended until ' . ($user->banned_until?->toDateString() ?? 'further notice') . '. Reason: ' . ($user->ban_reason ?? 'violation of terms.');
            throw ValidationException::withMessages(['email' => [$message]]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);

        AuditLog::record('auth:login', ['user_id' => $user->id]);

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'message' => 'Login successful.',
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ];
    }

    public function refreshToken(User $user): array
    {
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;
        return ['token' => $token];
    }

    public function getProfile(User $user): array
    {
        return $this->formatUser($user->load('shop'));
    }

    private function formatUser(User $user): array
    {
        return [
            'id'               => $user->id,
            'name'             => $user->name,
            'username'         => $user->username,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'avatar'           => $user->avatar,
            'role'             => $user->role,
            'email_verified'   => $user->email_verified,
            'has_two_factor'   => $user->hasTwoFactor(),
            'last_login_at'    => $user->last_login_at,
            'last_login_ip'    => $user->last_login_ip,
            'shop'             => $user->relationLoaded('shop') ? $user->shop : null,
            'created_at'       => $user->created_at,
        ];
    }
}
