<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Twilio\Rest\Client as TwilioClient;

class PhoneAuthController extends Controller
{
    private function normalize(string $phone): string
    {
        // Strip all spaces, dashes, dots, parentheses
        $phone = preg_replace('/[\s\-().]/', '', $phone);

        // Already full international: +85511665875
        if (str_starts_with($phone, '+855')) {
            return $phone;
        }

        // Has + but different country code — leave as-is
        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        // Starts with 855 (no +): 85511665875 → +85511665875
        if (str_starts_with($phone, '855')) {
            return '+' . $phone;
        }

        // Local format with leading 0: 011665875 → +85511665875
        if (str_starts_with($phone, '0')) {
            return '+855' . substr($phone, 1);
        }

        // Local without 0: 11665875 → +85511665875
        return '+855' . $phone;
    }

    // POST /auth/phone/send-otp
    public function sendOtp(Request $request): JsonResponse
    {
        $data  = $request->validate(['phone' => 'required|string|min:8']);
        $phone = $this->normalize($data['phone']);

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP in Redis for 5 minutes (keyed by phone)
        Cache::put("phone_otp:{$phone}", $otp, now()->addMinutes(5));

        // Send SMS via Twilio if configured
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from  = config('services.twilio.from');

        if ($sid && $token && $from) {
            try {
                $twilio = new TwilioClient($sid, $token);
                $twilio->messages->create($phone, [
                    'from' => $from,
                    'body' => "Your CamCart code: {$otp}. Expires in 5 minutes.",
                ]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Failed to send SMS. Check your phone number.'], 500);
            }
        } elseif (app()->environment('local', 'development')) {
            \Log::info("DEV OTP for {$phone}: {$otp}");
            return response()->json([
                'message' => 'SMS not configured. Use the code shown on screen.',
                'dev_otp'  => $otp,
            ]);
        } else {
            return response()->json(['message' => 'SMS service is not configured. Please sign in with email or Google.'], 503);
        }

        return response()->json(['message' => 'Verification code sent.']);
    }

    // POST /auth/phone/verify-otp
    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone'   => 'required|string',
            'otp'     => 'required|string|size:6',
            'purpose' => 'required|in:register,login',
        ]);

        $phone  = $this->normalize($data['phone']);
        $stored = Cache::get("phone_otp:{$phone}");

        if (!$stored || $stored !== $data['otp']) {
            return response()->json(['message' => 'Invalid or expired code. Please try again.'], 422);
        }

        // OTP is valid — consume it
        Cache::forget("phone_otp:{$phone}");

        if ($data['purpose'] === 'login') {
            $user = User::where('phone', $phone)->first();
            if (!$user) {
                return response()->json(['message' => 'No account found with this phone number.'], 404);
            }

            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Signed in successfully.',
                'token'   => $token,
                'user'    => [
                    'id'             => $user->id,
                    'name'           => $user->name,
                    'email'          => $user->email,
                    'phone'          => $user->phone,
                    'avatar'         => $user->avatar,
                    'role'           => $user->role,
                    'email_verified' => $user->email_verified,
                    'has_two_factor' => $user->hasTwoFactor(),
                ],
            ]);
        }

        // purpose = register: mark phone as verified in cache for 10 min
        Cache::put("phone_verified:{$phone}", true, now()->addMinutes(10));

        return response()->json([
            'message'  => 'Phone verified.',
            'verified' => true,
            'phone'    => $phone,
        ]);
    }

    // POST /auth/phone/firebase — verify Firebase phone ID token, sign in or create account
    public function firebaseLogin(Request $request): JsonResponse
    {
        $data = $request->validate(['id_token' => 'required|string']);

        // Verify the Firebase ID token with Google's public key endpoint
        $response = \Illuminate\Support\Facades\Http::get(
            "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" . config('services.firebase.api_key'),
            []
        );

        // Decode the JWT to get phone number (without full verification for simplicity)
        $parts   = explode('.', $data['id_token']);
        if (count($parts) !== 3) {
            return response()->json(['message' => 'Invalid token.'], 401);
        }
        $payload = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), strlen($parts[1]) % 4 === 0 ? 0 : 4 - strlen($parts[1]) % 4, '=')), true);

        if (!$payload || empty($payload['phone_number'])) {
            return response()->json(['message' => 'Could not extract phone number from token.'], 401);
        }

        // Verify token with Firebase REST API
        $verify = \Illuminate\Support\Facades\Http::post(
            "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" . config('services.firebase.api_key'),
            ['idToken' => $data['id_token']]
        );

        if (!$verify->ok() || empty($verify->json('users'))) {
            return response()->json(['message' => 'Invalid or expired verification code.'], 401);
        }

        $phone = $this->normalize($payload['phone_number']);
        $isNew = false;

        $user = User::where('phone', $phone)->first();

        if (!$user) {
            $isNew    = true;
            $phoneName = 'User ' . substr($phone, -4);
            $user = User::create([
                'name'           => $phoneName,
                'username'       => User::generateUsername($phoneName),
                'email'          => $username . '@phone.local',
                'phone'          => $phone,
                'password'       => str()->random(32),
                'role'           => 'customer',
                'email_verified' => false,
            ]);

            Cart::create(['user_id' => $user->id]);
            Wishlist::create(['user_id' => $user->id]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'          => $isNew ? 'Account created.' : 'Signed in.',
            'token'            => $token,
            'needs_onboarding' => $isNew,
            'user'             => [
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

    // POST /auth/phone/register  — called after OTP verified, creates the account
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone'                => 'required|string',
            'first_name'           => 'required|string|max:255',
            'last_name'            => 'required|string|max:255',
            'username'             => 'required|string|min:3|max:30|regex:/^[a-zA-Z0-9_]+$/|unique:users,username',
            'email'                => 'nullable|email|unique:users,email',
            'password'             => 'required|string|min:8|confirmed',
            'password_confirmation'=> 'required|string',
        ]);

        $phone = $this->normalize($data['phone']);

        // Ensure the phone was verified in this session
        if (!Cache::get("phone_verified:{$phone}")) {
            return response()->json(['message' => 'Phone not verified. Please verify your phone first.'], 422);
        }

        // One account per phone number
        if (User::where('phone', $phone)->exists()) {
            return response()->json(['message' => 'An account with this phone number already exists.'], 422);
        }

        Cache::forget("phone_verified:{$phone}");

        $user = User::create([
            'name'           => trim($data['first_name'] . ' ' . $data['last_name']),
            'username'       => $data['username'],
            'email'          => $data['email'] ?? ($data['username'] . '@phone.local'),
            'phone'          => $phone,
            'password'       => $data['password'],
            'role'           => 'customer',
            'email_verified' => false,
        ]);

        Cart::create(['user_id' => $user->id]);
        Wishlist::create(['user_id' => $user->id]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'token'   => $token,
            'user'    => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'phone'          => $user->phone,
                'avatar'         => $user->avatar,
                'role'           => $user->role,
                'email_verified' => $user->email_verified,
                'has_two_factor' => false,
            ],
        ], 201);
    }
}
