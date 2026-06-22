<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(private readonly AnalyticsService $analyticsService) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'dashboard' => $this->analyticsService->adminDashboard(),
        ]);
    }
}
