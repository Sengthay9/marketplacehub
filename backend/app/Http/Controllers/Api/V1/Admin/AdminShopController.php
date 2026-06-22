<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Notifications\UserModerationNotification;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminShopController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $shops = Shop::with('owner:id,name,email')
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('q'), fn ($q, $search) =>
                $q->where('name', 'ilike', "%$search%")
            )
            ->latest()
            ->paginate(20);

        return response()->json($shops);
    }

    public function show(int $id): JsonResponse
    {
        $shop = Shop::with(['owner:id,name,email', 'products'])->findOrFail($id);
        return response()->json(['shop' => $shop]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $shop = Shop::findOrFail($id);
        $shop->update(['status' => 'approved', 'rejection_reason' => null]);

        $this->notificationService->send($shop->owner, 'shop_approved', [
            'title'   => 'Shop Approved!',
            'message' => "Your shop '{$shop->name}' has been approved.",
            'data'    => ['shop_id' => $shop->id],
        ]);

        return response()->json(['message' => 'Shop approved.', 'shop' => $shop]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $shop = Shop::findOrFail($id);
        $shop->update(['status' => 'rejected', 'rejection_reason' => $request->input('reason')]);

        $this->notificationService->send($shop->owner, 'shop_rejected', [
            'title'   => 'Shop Application Rejected',
            'message' => "Your shop '{$shop->name}' was rejected: " . $request->input('reason'),
            'data'    => ['shop_id' => $shop->id],
        ]);

        return response()->json(['message' => 'Shop rejected.', 'shop' => $shop]);
    }

    public function warn(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $shop = Shop::with('owner')->findOrFail($id);

        try { $shop->owner?->notify(new UserModerationNotification('warn', $request->reason)); } catch (\Throwable) {}

        return response()->json(['message' => "Warning sent to {$shop->name}."]);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'days'   => 'nullable|integer|min:1|max:365',
        ]);
        $shop = Shop::with('owner')->findOrFail($id);
        $shop->update(['status' => 'suspended', 'rejection_reason' => $request->reason]);

        $days  = $request->integer('days', 0);
        $until = $days > 0 ? now()->addDays($days)->toDateString() : null;

        try { $shop->owner?->notify(new UserModerationNotification('suspend', $request->reason, $until)); } catch (\Throwable) {}

        return response()->json(['message' => "Shop '{$shop->name}' suspended.", 'shop' => $shop]);
    }

    public function ban(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $shop = Shop::with('owner')->findOrFail($id);
        $shop->update(['status' => 'banned', 'rejection_reason' => $request->reason]);

        try { $shop->owner?->notify(new UserModerationNotification('ban', $request->reason)); } catch (\Throwable) {}

        return response()->json(['message' => "Shop '{$shop->name}' has been permanently banned."]);
    }

    public function unban(int $id): JsonResponse
    {
        $shop = Shop::with('owner')->findOrFail($id);
        $shop->update(['status' => 'approved', 'rejection_reason' => null]);

        try { $shop->owner?->notify(new UserModerationNotification('unban', 'Your shop has been restored.')); } catch (\Throwable) {}

        return response()->json(['message' => "Shop '{$shop->name}' has been restored."]);
    }

    public function destroy(int $id): JsonResponse
    {
        Shop::findOrFail($id)->delete();
        return response()->json(['message' => 'Shop deleted.']);
    }
}
