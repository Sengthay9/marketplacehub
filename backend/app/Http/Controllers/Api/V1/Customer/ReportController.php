<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reportable_type' => 'required|in:product,shop,user,order',
            'reportable_id'   => 'required|integer',
            'subject'         => 'nullable|string|max:200',
            'reason'          => 'required|in:fraud,spam,inappropriate,misleading,scam,poor_quality,other',
            'description'     => 'required|string|min:10|max:2000',
        ]);

        $typeMap = [
            'product' => \App\Models\Product::class,
            'shop'    => \App\Models\Shop::class,
            'user'    => \App\Models\User::class,
            'order'   => \App\Models\Order::class,
        ];

        $report = Report::create([
            'reporter_id'      => $request->user()->id,
            'reportable_type'  => $typeMap[$data['reportable_type']],
            'reportable_id'    => $data['reportable_id'],
            'subject'          => $data['subject'],
            'reason'           => $data['reason'],
            'description'      => $data['description'],
            'status'           => 'pending',
        ]);

        return response()->json(['message' => 'Report submitted. Our team will review it.', 'report' => $report], 201);
    }

    public function myReports(Request $request): JsonResponse
    {
        $reports = Report::where('reporter_id', $request->user()->id)
            ->latest()
            ->paginate(10);
        return response()->json($reports);
    }
}
