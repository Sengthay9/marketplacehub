<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use PragmaRX\Google2FALaravel\Support\Authenticator;

class TwoFactorController extends Controller
{
    public function setup(Request $request): JsonResponse
    {
        $user   = $request->user();
        $google = app('pragmarx.google2fa');

        if ($user->two_factor_confirmed_at) {
            return response()->json(['message' => '2FA is already enabled.'], 422);
        }

        $secret = $google->generateSecretKey();
        $user->update(['two_factor_secret' => Crypt::encryptString($secret)]);

        $qrUrl = $google->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret,
        );

        return response()->json([
            'secret'   => $secret,
            'qr_url'   => $qrUrl,
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|digits:6']);

        $user   = $request->user();
        $google = app('pragmarx.google2fa');

        if (! $user->two_factor_secret) {
            return response()->json(['message' => 'Run /setup first.'], 422);
        }

        $secret = Crypt::decryptString($user->two_factor_secret);
        $valid  = $google->verifyKey($secret, $request->code);

        if (! $valid) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        $recoveryCodes = collect(range(1, 8))->map(fn () => Str::random(10) . '-' . Str::random(10))->all();

        $user->update([
            'two_factor_confirmed_at'  => now(),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
        ]);

        AuditLog::record('2fa:enabled');

        return response()->json([
            'message'        => '2FA enabled.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    public function disable(Request $request): JsonResponse
    {
        $request->validate(['password' => 'required|string|current_password']);

        $request->user()->update([
            'two_factor_secret'        => null,
            'two_factor_confirmed_at'  => null,
            'two_factor_recovery_codes' => null,
        ]);

        AuditLog::record('2fa:disabled');

        return response()->json(['message' => '2FA disabled.']);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $user   = $request->user();
        $google = app('pragmarx.google2fa');

        if (! $user->two_factor_secret || ! $user->two_factor_confirmed_at) {
            return response()->json(['message' => '2FA not configured.'], 422);
        }

        $secret = Crypt::decryptString($user->two_factor_secret);

        // Try TOTP code
        if ($google->verifyKey($secret, $request->code)) {
            return response()->json(['message' => 'Verified.']);
        }

        // Try recovery code
        $codes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
        $index = array_search($request->code, $codes, true);
        if ($index !== false) {
            unset($codes[$index]);
            $user->update([
                'two_factor_recovery_codes' => Crypt::encryptString(json_encode(array_values($codes))),
            ]);
            return response()->json(['message' => 'Verified via recovery code.']);
        }

        AuditLog::record('2fa:failed');
        return response()->json(['message' => 'Invalid code.'], 422);
    }

    public function recoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->two_factor_confirmed_at) {
            return response()->json(['message' => '2FA not enabled.'], 422);
        }

        $codes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
        return response()->json(['recovery_codes' => $codes]);
    }
}
