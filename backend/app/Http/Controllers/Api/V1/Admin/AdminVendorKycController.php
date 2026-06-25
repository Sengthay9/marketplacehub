<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\VendorKyc;
use App\Models\User;
use App\Notifications\VendorApprovedNotification;
use App\Notifications\VendorRejectedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        // Generate username from vendor's first name
        $firstName = explode(' ', trim($kyc->full_name))[0];
        $username  = User::generateUsername($firstName);

        // Generate secure temp password
        $plainPassword = Str::random(8) . '!A1';

        $kyc->user->update([
            'username'              => $username,
            'password'              => $plainPassword,
            'vendor_status'         => 'approved',
            'email_verified'        => true,
            'email_verified_at'     => now(),
            'force_password_change' => true,
        ]);

        $kyc->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        try {
            $kyc->user->notify(new VendorApprovedNotification($username, $plainPassword));
        } catch (\Throwable $e) {
            \Log::warning('VendorApprovedNotification failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Vendor approved. Credentials sent by email.']);
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

        try {
            $kyc->user->notify(new VendorRejectedNotification($request->reason));
        } catch (\Throwable $e) {
            \Log::warning('VendorRejectedNotification failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Vendor application rejected. Email sent to applicant.']);
    }
}
