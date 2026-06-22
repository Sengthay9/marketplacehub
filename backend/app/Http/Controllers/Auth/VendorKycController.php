<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VendorKyc;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VendorKycController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'email'          => 'required|email|unique:users,email',
            'full_name'      => 'required|string|min:2|max:100',
            'date_of_birth'  => 'required|date|before:-18 years',
            'gender'         => 'required|in:male,female,other',
            'id_number'      => 'required|string|unique:vendor_kyc,id_number',
            'address'        => 'required|string|max:255',
            'city'           => 'required|string|max:100',
            'province'       => 'nullable|string|max:100',
            'id_card_front'  => 'required|string',
            'id_card_back'   => 'required|string',
            'selfie_with_id' => 'nullable|string',
        ]);

        // Create the user account with role=vendor and no password (admin will set it on approval)
        $user = User::create([
            'name'           => $request->full_name,
            'email'          => $request->email,
            'password'       => \Str::random(32), // random password, will be reset on approval
            'role'           => 'vendor',
            'email_verified' => false,
        ]);

        VendorKyc::create([
            'user_id'       => $user->id,
            'full_name'     => $request->full_name,
            'date_of_birth' => $request->date_of_birth,
            'gender'        => $request->gender,
            'id_number'     => $request->id_number,
            'address'       => $request->address,
            'city'          => $request->city,
            'province'      => $request->province,
            'id_card_front' => $request->id_card_front,
            'id_card_back'  => $request->id_card_back,
            'selfie_with_id'=> $request->selfie_with_id,
            'status'        => 'pending',
        ]);

        return response()->json([
            'message' => 'Your vendor application has been submitted. We will review your documents and contact you by email within 1-3 business days.',
        ], 201);
    }
}
