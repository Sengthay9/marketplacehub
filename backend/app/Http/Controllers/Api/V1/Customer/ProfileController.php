<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('addresses');

        return response()->json([
            'data' => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'phone'       => $user->phone,
                'avatar'      => $user->avatar,
                'role'        => $user->role,
                'addresses'   => $user->addresses,
                'created_at'  => $user->created_at,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'                  => 'sometimes|string|max:100',
            'phone'                 => 'sometimes|nullable|string|max:20',
            'current_password'      => 'sometimes|string',
            'password'              => 'sometimes|string|min:8|confirmed',
            'password_confirmation' => 'sometimes|string',
        ]);

        if (!empty($data['password'])) {
            if (empty($data['current_password']) || !Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Current password is incorrect.'],
                ]);
            }
        }

        $user->update(array_filter([
            'name'     => $data['name']     ?? null,
            'phone'    => $data['phone']    ?? null,
            'password' => !empty($data['password']) ? $data['password'] : null,
        ], fn($v) => $v !== null));

        return response()->json(['message' => 'Profile updated.', 'user' => $user->fresh()]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|max:2048|mimes:jpg,jpeg,png,webp']);

        $user = $request->user();

        // Delete old avatar
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store("avatars/user_{$user->id}", 'public');
        $user->update(['avatar' => Storage::url($path)]);

        return response()->json(['message' => 'Avatar updated.', 'avatar' => $user->avatar]);
    }
}
