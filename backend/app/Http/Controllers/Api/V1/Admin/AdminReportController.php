<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reports = Report::with(['reporter:id,name,email,role', 'resolver:id,name'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->reason, fn ($q, $r) => $q->where('reason', $r))
            ->when($request->role, fn ($q, $r) =>
                $q->whereHas('reporter', fn ($sq) => $sq->where('role', $r))
            )
            ->when($request->q, fn ($q, $s) =>
                $q->where(fn ($sq) =>
                    $sq->where('description', 'ilike', "%$s%")
                       ->orWhere('subject', 'ilike', "%$s%")
                )
            )
            ->latest()
            ->paginate(50);

        $counts = [
            'pending'   => Report::where('status', 'pending')->count(),
            'reviewing' => Report::where('status', 'reviewing')->count(),
            'resolved'  => Report::where('status', 'resolved')->count(),
            'dismissed' => Report::where('status', 'dismissed')->count(),
            'unread'    => Report::where('is_read', false)->count(),
        ];

        return response()->json(['reports' => $reports, 'counts' => $counts]);
    }

    public function show(int $id): JsonResponse
    {
        $report = Report::with(['reporter:id,name,email,role', 'reportable', 'resolver:id,name'])
            ->findOrFail($id);

        // Mark as read when opened
        if (! $report->is_read) {
            $report->update(['is_read' => true]);
        }

        return response()->json(['report' => $report]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status'      => 'required|in:pending,reviewing,resolved,dismissed',
            'admin_note'  => 'nullable|string|max:1000',
            'admin_reply' => 'nullable|string|max:2000',
        ]);

        $report = Report::findOrFail($id);

        $update = [
            'status'     => $data['status'],
            'admin_note' => $data['admin_note'] ?? $report->admin_note,
            'is_read'    => true,
        ];

        if (! empty($data['admin_reply'])) {
            $update['admin_reply'] = $data['admin_reply'];
            $update['replied_at']  = now();
        }

        if (in_array($data['status'], ['resolved', 'dismissed'])) {
            $update['resolved_by'] = $request->user()->id;
            $update['resolved_at'] = now();
        }

        $report->update($update);

        return response()->json(['message' => 'Report updated.', 'report' => $report->fresh(['reporter:id,name,email,role'])]);
    }

    public function markRead(int $id): JsonResponse
    {
        Report::findOrFail($id)->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read.']);
    }

    public function destroy(int $id): JsonResponse
    {
        Report::findOrFail($id)->delete();
        return response()->json(['message' => 'Report deleted.']);
    }
}
