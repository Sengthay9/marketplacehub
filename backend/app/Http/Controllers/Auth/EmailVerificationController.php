<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Notifications\VerifyEmailNotification;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (sha1($user->email) !== $hash) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if ($user->email_verified) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->update([
            'email_verified'    => true,
            'email_verified_at' => now(),
        ]);

        return response()->json(['message' => 'Email verified successfully.']);
    }

    public function resend(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Verification email sent if the account exists.']);
        }

        if ($user->email_verified) {
            return response()->json(['message' => 'This email is already verified.'], 400);
        }

        $user->notify(new VerifyEmailNotification());

        return response()->json(['message' => 'Verification email sent.']);
    }
}
