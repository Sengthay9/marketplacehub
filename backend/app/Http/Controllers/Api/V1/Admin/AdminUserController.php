<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\UserModerationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::withTrashed()
            ->where('role', 'customer')
            ->when($request->input('q'), fn ($q, $s) =>
                $q->where('name', 'ilike', "%$s%")->orWhere('email', 'ilike', "%$s%")
            )
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
}
