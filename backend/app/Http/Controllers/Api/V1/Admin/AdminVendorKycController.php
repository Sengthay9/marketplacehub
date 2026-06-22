<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\VendorKyc;
use App\Models\User;
use App\Notifications\VendorApprovedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminVendorKycController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $kycs = VendorKyc::with('user')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        return response()->json($kycs);
    }

    public function show(int $id): JsonResponse
    {
        $kyc = VendorKyc::with(['user', 'reviewer'])->findOrFail($id);
        return response()->json($kyc);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $kyc = VendorKyc::with('user')->findOrFail($id);

        if (!$kyc->isPending()) {
            return response()->json(['message' => 'KYC is not in pending status.'], 400);
        }

        // Generate a secure temporary password
        $plainPassword = Str::random(10) . '!A1';

        $kyc->user->update([
            'password'       => $plainPassword,
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        $kyc->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        try {
            $kyc->user->notify(new VendorApprovedNotification($plainPassword));
        } catch (\Throwable $e) {
            \Log::warning('VendorApprovedNotification failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Vendor KYC approved. Credentials sent by email.']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $kyc = VendorKyc::with('user')->findOrFail($id);

        if (!$kyc->isPending()) {
            return response()->json(['message' => 'KYC is not in pending status.'], 400);
        }

        $kyc->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->reason,
            'reviewed_by'      => $request->user()->id,
            'reviewed_at'      => now(),
        ]);

        return response()->json(['message' => 'Vendor KYC rejected.']);
    }
}
