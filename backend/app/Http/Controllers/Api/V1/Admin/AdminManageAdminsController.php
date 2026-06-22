<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminManageAdminsController extends Controller
{
    private function requireSuperAdmin(Request $request): ?JsonResponse
    {
        if (! $request->user()?->is_super_admin) {
            return response()->json(['message' => 'Only super admins can manage admin accounts.'], 403);
        }
        return null;
    }

    public function index(): JsonResponse
    {
        $admins = User::where('role', 'admin')
            ->select('id', 'name', 'email', 'is_super_admin', 'last_login_at', 'created_at')
            ->latest()
            ->get();

        return response()->json(['admins' => $admins]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperAdmin($request)) return $err;

        $data = $request->validate([
            'name'           => 'required|string|max:100',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:8',
            'is_super_admin' => 'boolean',
        ]);

        $admin = User::create([
            'name'           => $data['name'],
            'email'          => $data['email'],
            'password'       => Hash::make($data['password']),
            'role'           => 'admin',
            'is_super_admin' => $data['is_super_admin'] ?? false,
            'email_verified' => true,
        ]);

        AuditLog::record('admin:create', [
            'auditable_type' => User::class,
            'auditable_id'   => $admin->id,
            'new_values'     => ['name' => $admin->name, 'email' => $admin->email, 'is_super_admin' => $admin->is_super_admin],
        ]);

        return response()->json(['message' => "Admin account created for {$admin->name}.", 'admin' => $admin], 201);
    }

    public function toggleSuperAdmin(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperAdmin($request)) return $err;

        $admin = User::where('role', 'admin')->findOrFail($id);

        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot change your own super-admin status.'], 422);
        }

        $admin->update(['is_super_admin' => ! $admin->is_super_admin]);

        $event = $admin->is_super_admin ? 'admin:promote' : 'admin:demote';
        AuditLog::record($event, [
            'auditable_type' => User::class,
            'auditable_id'   => $admin->id,
            'new_values'     => ['target' => $admin->name, 'is_super_admin' => $admin->is_super_admin],
        ]);

        $label = $admin->is_super_admin ? 'promoted to Super Admin' : 'demoted to regular Admin';
        return response()->json(['message' => "{$admin->name} has been $label.", 'admin' => $admin]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->requireSuperAdmin($request)) return $err;

        $admin = User::where('role', 'admin')->findOrFail($id);

        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot remove your own admin account.'], 422);
        }

        AuditLog::record('admin:remove', [
            'auditable_type' => User::class,
            'auditable_id'   => $admin->id,
            'new_values'     => ['target' => $admin->name, 'email' => $admin->email],
        ]);

        $admin->update(['role' => 'customer', 'is_super_admin' => false]);
        $admin->tokens()->delete();

        return response()->json(['message' => "{$admin->name}'s admin access has been revoked."]);
    }
}
