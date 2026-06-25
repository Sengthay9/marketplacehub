<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private string $frontendUrl;

    public function __construct()
    {
        $this->frontendUrl = env('FRONTEND_URL', 'http://localhost');
    }

    public function redirectToGoogle(): RedirectResponse
    {
        if (!config('services.google.client_id') || !config('services.google.client_secret')) {
            return redirect($this->frontendUrl . '/auth/callback?error=not_configured');
        }

        // Pass mode (login|register) through the OAuth state via session
        $mode = request()->query('mode', 'register');
        session(['google_oauth_mode' => $mode]);

        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect($this->frontendUrl . '/auth/callback?error=google_failed');
        }

        // We can't use session with stateless, so check the referrer or default to register
        // The mode is passed as a query param on the initial redirect and stored before stateless redirect
        $mode  = session('google_oauth_mode', 'register');
        $isNew = false;

        $user = User::where('google_id', $googleUser->getId())
                    ->orWhere('email', $googleUser->getEmail())
                    ->first();

        if ($user) {
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->getId()]);
            }
        } else {
            // Login mode — account doesn't exist, reject
            if ($mode === 'login') {
                return redirect($this->frontendUrl . '/auth/callback?error=not_registered');
            }

            $isNew = true;
            $googleName   = $googleUser->getName() ?? $googleUser->getEmail();
            $emailPrefix  = explode('@', $googleUser->getEmail())[0];
            $user = User::create([
                'name'           => $googleName,
                'username'       => User::generateUsername($emailPrefix),
                'email'          => $googleUser->getEmail(),
                'google_id'      => $googleUser->getId(),
                'avatar'         => $googleUser->getAvatar(),
                'role'           => 'customer',
                'email_verified' => true,
                'password'       => str()->random(32),
            ]);

            Cart::create(['user_id' => $user->id]);
            Wishlist::create(['user_id' => $user->id]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        $params = http_build_query([
            'token'            => $token,
            'role'             => $user->role,
            'name'             => $user->name,
            'needs_onboarding' => $isNew ? '1' : '0',
        ]);

        return redirect($this->frontendUrl . '/auth/callback?' . $params);
    }

    // POST /auth/google/token — frontend passes Google access_token, we verify and sign in
    public function handleGoogleToken(Request $request): JsonResponse
    {
        $data = $request->validate(['access_token' => 'required|string']);

        // Fetch user info from Google using the access token
        $response = \Illuminate\Support\Facades\Http::get('https://www.googleapis.com/oauth2/v3/userinfo', [
            'access_token' => $data['access_token'],
        ]);

        if (!$response->ok()) {
            return response()->json(['message' => 'Invalid Google token.'], 401);
        }

        $googleUser = $response->json();
        $isNew = false;

        $user = User::where('google_id', $googleUser['sub'])
                    ->orWhere('email', $googleUser['email'])
                    ->first();

        if ($user) {
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser['sub']]);
            }
        } else {
            $isNew = true;
            $googleName  = $googleUser['name'] ?? $googleUser['email'];
            $emailPrefix = explode('@', $googleUser['email'])[0];
            $user = User::create([
                'name'           => $googleName,
                'username'       => User::generateUsername($emailPrefix),
                'email'          => $googleUser['email'],
                'google_id'      => $googleUser['sub'],
                'avatar'         => $googleUser['picture'] ?? null,
                'role'           => 'customer',
                'email_verified' => true,
                'password'       => str()->random(32),
            ]);

            Cart::create(['user_id' => $user->id]);
            Wishlist::create(['user_id' => $user->id]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'               => $isNew ? 'Account created.' : 'Signed in.',
            'token'                 => $token,
            'needs_onboarding'      => $isNew,
            'force_password_change' => (bool) $user->force_password_change,
            'user'                  => [
                'id'                    => $user->id,
                'name'                  => $user->name,
                'email'                 => $user->email,
                'phone'                 => $user->phone,
                'avatar'                => $user->avatar,
                'role'                  => $user->role,
                'email_verified'        => $user->email_verified,
                'force_password_change' => (bool) $user->force_password_change,
            ],
        ]);
    }

    // PATCH /auth/onboard — called after Google/Phone sign-up to set name + password
    public function onboard(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'username'   => 'required|string|min:3|max:30|regex:/^[a-zA-Z0-9_]+$/|unique:users,username,' . $request->user()->id,
            'password'   => 'nullable|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $update = [
            'name'     => trim($data['first_name'] . ' ' . $data['last_name']),
            'username' => $data['username'],
        ];

        if (!empty($data['password'])) {
            $update['password'] = $data['password'];
        }

        $user->update($update);

        return response()->json([
            'message' => 'Profile completed.',
            'user'    => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'phone'          => $user->phone,
                'avatar'         => $user->avatar,
                'role'           => $user->role,
                'email_verified' => $user->email_verified,
            ],
        ]);
    }
}
