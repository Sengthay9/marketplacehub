<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VendorKyc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VendorKycController extends Controller
{
    // POST /auth/vendor/register
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'phone'        => 'required|string|max:20',
            'date_of_birth'=> 'required|date',
            'gender'       => 'required|in:male,female,other',
            'address'      => 'required|string|max:500',
            'city'         => 'nullable|string|max:100',
            'province'     => 'nullable|string|max:100',
            'purpose'      => 'required|string|max:1000',
            'id_card_front'=> 'required|image|max:5120',
            'id_card_back' => 'required|image|max:5120',
            'selfie_with_id'=> 'required|image|max:5120',
        ]);

        $fullName = trim($request->first_name . ' ' . $request->last_name);

        // Create user with no username/password — set on approval
        $user = User::create([
            'name'          => $fullName,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'password'      => \Illuminate\Support\Str::random(32),
            'role'          => 'vendor',
            'vendor_status' => 'pending',
            'email_verified'=> false,
        ]);

        // Store uploaded documents
        $front   = $request->file('id_card_front')->store('kyc/ids', 'public');
        $back    = $request->file('id_card_back')->store('kyc/ids', 'public');
        $selfie  = $request->file('selfie_with_id')->store('kyc/selfies', 'public');

        VendorKyc::create([
            'user_id'       => $user->id,
            'full_name'     => $fullName,
            'date_of_birth' => $request->date_of_birth,
            'gender'        => $request->gender,
            'address'       => $request->address,
            'city'          => $request->city,
            'province'      => $request->province,
            'purpose'       => $request->purpose,
            'id_card_front' => '/storage/' . $front,
            'id_card_back'  => '/storage/' . $back,
            'selfie_with_id'=> '/storage/' . $selfie,
        ]);

        return response()->json([
            'message' => 'Your vendor application has been submitted and is under review. You will receive an email with your login credentials once approved.',
        ], 201);
    }
}
