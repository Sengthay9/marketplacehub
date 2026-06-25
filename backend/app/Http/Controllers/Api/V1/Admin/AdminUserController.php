<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminUserController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $filter = $request->input('filter'); // 'suspended' | 'banned' | null (all)

        $users = User::withTrashed()
            ->where('role', 'customer')
            ->when($request->input('q'), fn ($q, $s) =>
                $q->where(fn ($sub) => $sub->where('name', 'ilike', "%$s%")
                                          ->orWhere('email', 'ilike', "%$s%")
                                          ->orWhere('phone', 'ilike', "%$s%"))
            )
            ->when(!$filter,                fn ($q) => $q->where(fn ($sub) => $sub->whereNull('ban_type')->orWhere('ban_type', 'warn')))
            ->when($filter === 'new',       fn ($q) => $q->where('created_at', '>=', now()->subDays(3))
                                                         ->where(fn ($sub) => $sub->whereNull('ban_type')->orWhere('ban_type', 'warn')))
            ->when($filter === 'suspended', fn ($q) => $q->where('ban_type', 'suspend'))
            ->when($filter === 'banned',    fn ($q) => $q->where('ban_type', 'ban'))
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::withTrashed()
            ->with(['orders' => fn ($q) => $q->latest()->limit(5)])
            ->findOrFail($id);
        return response()->json(['user' => $user]);
    }

    public function warn(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['reason' => 'required|string|max:500']);

        $user = User::withTrashed()->findOrFail($id);
        $user->update(['ban_type' => 'warn', 'ban_reason' => $data['reason']]);

        try { $user->notify(new UserModerationNotification('warn', $data['reason'])); } catch (\Throwable) {}

        return response()->json(['message' => 'Warning sent to ' . $user->name . '.']);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => 'required|string|max:500',
            'days'   => 'required|integer|min:1|max:365',
        ]);

        $user  = User::withTrashed()->findOrFail($id);
        $until = now()->addDays((int) $data['days']);

        $user->update(['ban_type' => 'suspend', 'ban_reason' => $data['reason'], 'banned_until' => $until]);
        $user->tokens()->delete();
        if (! $user->trashed()) $user->delete();

        try { $user->notify(new UserModerationNotification('suspend', $data['reason'], $until->toDateString())); } catch (\Throwable) {}

        return response()->json(['message' => $user->name . ' suspended until ' . $until->toDateString() . '.']);
    }

    public function ban(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['reason' => 'required|string|max:500']);

        $user = User::withTrashed()->findOrFail($id);
        $user->update(['ban_type' => 'ban', 'ban_reason' => $data['reason'], 'banned_until' => null]);
        $user->tokens()->delete();
        if (! $user->trashed()) $user->delete();

        try { $user->notify(new UserModerationNotification('ban', $data['reason'])); } catch (\Throwable) {}

        return response()->json(['message' => $user->name . ' has been permanently banned.']);
    }

    public function unban(int $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        if ($user->trashed()) $user->restore();
        $user->update(['ban_type' => null, 'ban_reason' => null, 'banned_until' => null]);

        try { $user->notify(new UserModerationNotification('unban', 'Your account has been restored.')); } catch (\Throwable) {}

        return response()->json(['message' => $user->name . '\'s account has been restored.']);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        $data = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'email' => "sometimes|email|unique:users,email,$id",
        ]);
        $user->update($data);
        return response()->json(['user' => $user]);
    }

    public function destroy(int $id): JsonResponse
    {
        User::withTrashed()->findOrFail($id)->forceDelete();
        return response()->json(['message' => 'User permanently deleted.']);
    }

    // ── Vendor management ──────────────────────────────────

    public function vendors(Request $request): JsonResponse
    {
        $status = $request->input('vendor_status');

        $vendors = User::with([
                'shop:id,user_id,name,logo,banner,address,contact_number,email',
                'vendorKyc:id,user_id,full_name,date_of_birth,gender,address,city,province,purpose,id_card_front,id_card_back,selfie_with_id,status',
            ])
            ->where('role', 'vendor')
            ->when($status, fn ($q) => $q->where('vendor_status', $status))
            ->when($request->input('q'), fn ($q, $s) =>
                $q->where(fn ($sub) => $sub
                    ->where('name', 'ilike', "%$s%")
                    ->orWhere('email', 'ilike', "%$s%")
                    ->orWhereHas('shop', fn ($sq) => $sq->where('name', 'ilike', "%$s%"))
                )
            )
            ->latest()
            ->paginate(20);

        return response()->json($vendors);
    }

    public function warnVendor(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $vendor = User::where('role', 'vendor')->findOrFail($id);
        $this->notificationService->send($vendor, 'vendor_warned', [
            'title'   => 'Warning from CamCart Admin',
            'message' => "You have received a warning: " . $request->input('reason') . ". Please follow our community guidelines or further action may be taken.",
            'data'    => [],
        ]);
        return response()->json(['message' => 'Warning sent to ' . $vendor->name . '.']);
    }

    public function approveVendor(int $id): JsonResponse
    {
        $vendor = User::where('role', 'vendor')->findOrFail($id);

        // Generate username from first name if not already set
        $username = $vendor->username;
        if (!$username) {
            $firstName = explode(' ', trim($vendor->name))[0];
            $username  = User::generateUsername($firstName);
        }

        // Generate temp password
        $plainPassword = \Illuminate\Support\Str::random(8) . '!A1';

        $vendor->update([
            'username'          => $username,
            'password'          => $plainPassword,
            'vendor_status'     => 'approved',
            'email_verified'    => true,
            'email_verified_at' => now(),
        ]);

        try {
            $vendor->notify(new \App\Notifications\VendorApprovedNotification($username, $plainPassword));
        } catch (\Throwable $e) {
            \Log::warning('VendorApprovedNotification failed: ' . $e->getMessage());
        }

        return response()->json(['message' => $vendor->name . ' approved. Credentials sent by email.']);
    }

    public function rejectVendor(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $vendor = User::where('role', 'vendor')->findOrFail($id);
        $vendor->update(['vendor_status' => 'rejected']);

        try {
            $vendor->notify(new \App\Notifications\VendorRejectedNotification($request->reason));
        } catch (\Throwable $e) {
            \Log::warning('VendorRejectedNotification failed: ' . $e->getMessage());
        }

        return response()->json(['message' => $vendor->name . '\'s application rejected. Email sent.']);
    }

    public function suspendVendor(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500', 'days' => 'nullable|integer|min:1']);
        $vendor = User::with('shop')->where('role', 'vendor')->findOrFail($id);
        $vendor->update(['vendor_status' => 'suspended']);
        $vendor->tokens()->delete();
        $vendor->shop?->update(['status' => 'suspended']);
        $this->notificationService->send($vendor, 'vendor_suspended', [
            'title'   => 'Your Vendor Account Has Been Suspended',
            'message' => "Your vendor account has been suspended. Reason: " . $request->input('reason', 'Policy violation.'),
            'data'    => [],
        ]);
        return response()->json(['message' => $vendor->name . ' suspended. Shop temporarily closed.']);
    }

    public function banVendor(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);
        $vendor = User::with('shop')->where('role', 'vendor')->findOrFail($id);
        $vendor->update(['vendor_status' => 'banned']);
        $vendor->tokens()->delete();
        $vendor->shop?->update(['status' => 'banned']);
        $this->notificationService->send($vendor, 'vendor_banned', [
            'title'   => 'Your Vendor Account Has Been Banned',
            'message' => "Your vendor account has been permanently banned. Reason: " . $request->input('reason', 'Policy violation.'),
            'data'    => [],
        ]);
        return response()->json(['message' => $vendor->name . ' banned. Shop removed from site.']);
    }

    public function unbanVendor(int $id): JsonResponse
    {
        $vendor = User::with('shop')->where('role', 'vendor')->findOrFail($id);
        $vendor->update(['vendor_status' => 'approved']);
        if ($vendor->shop && in_array($vendor->shop->status, ['suspended', 'banned'])) {
            $vendor->shop->update(['status' => 'approved']);
        }
        return response()->json(['message' => $vendor->name . ' restored.']);
    }

    public function getVendorShop(int $id): JsonResponse
    {
        $vendor = User::with('shop')->where('role', 'vendor')->findOrFail($id);
        return response()->json(['shop' => $vendor->shop]);
    }

    public function uploadVendorShopLogo(Request $request, int $id): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:2048']);
        $vendor = User::with('shop')->where('role', 'vendor')->findOrFail($id);
        if (!$vendor->shop) return response()->json(['message' => 'Shop not found.'], 404);

        if ($vendor->shop->logo) {
            $old = str_replace('/storage/', '', $vendor->shop->logo);
            Storage::disk('public')->delete($old);
        }
        $path = $request->file('logo')->store('shops/logos', 'public');
        $vendor->shop->update(['logo' => '/storage/' . $path]);
        return response()->json(['logo_url' => '/storage/' . $path, 'message' => 'Logo updated.']);
    }

    public function uploadVendorShopBanner(Request $request, int $id): JsonResponse
    {
        $request->validate(['banner' => 'required|image|max:4096']);
        $vendor = User::with('shop')->where('role', 'vendor')->findOrFail($id);
        if (!$vendor->shop) return response()->json(['message' => 'Shop not found.'], 404);

        if ($vendor->shop->banner) {
            $old = str_replace('/storage/', '', $vendor->shop->banner);
            Storage::disk('public')->delete($old);
        }
        $path = $request->file('banner')->store('shops/banners', 'public');
        $vendor->shop->update(['banner' => '/storage/' . $path]);
        return response()->json(['banner_url' => '/storage/' . $path, 'message' => 'Background image updated.']);
    }
}
