<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'                  => 'sometimes|string|max:100',
            'phone'                 => 'sometimes|nullable|string|max:20',
            'avatar'                => 'sometimes|nullable|string',
            'current_password'      => 'sometimes|string',
            'password'              => 'sometimes|string|min:8|confirmed',
            'password_confirmation' => 'sometimes|string',
        ]);

        // Handle password change
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
            'avatar'   => $data['avatar']   ?? null,
            'password' => !empty($data['password']) ? $data['password'] : null,
        ], fn ($v) => $v !== null));

        return response()->json([
            'message' => 'Profile updated.',
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role'  => $user->role,
            ],
        ]);
    }
}
