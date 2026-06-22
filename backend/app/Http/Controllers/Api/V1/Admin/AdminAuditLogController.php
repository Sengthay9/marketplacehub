<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email,role,is_super_admin')
            ->when($request->event, fn ($q, $e) => $q->where('event', 'like', "$e%"))
            ->when($request->admin_id, fn ($q, $id) => $q->where('user_id', $id))
            ->when($request->from, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->to,   fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->orderByDesc('created_at')
            ->paginate(50);

        $eventGroups = AuditLog::selectRaw("split_part(event, ':', 1) as prefix")
            ->distinct()
            ->pluck('prefix')
            ->filter()
            ->values();

        return response()->json(['logs' => $logs, 'event_groups' => $eventGroups]);
    }
}
