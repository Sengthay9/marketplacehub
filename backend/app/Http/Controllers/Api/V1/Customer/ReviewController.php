<?php
namespace App\Http\Controllers\Api\V1\Customer;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ReviewController extends Controller
{
    public function __call($name, $args): JsonResponse
    {
        return response()->json(['message' => 'Not yet implemented.'], 501);
    }
    public function index(Request $r): JsonResponse { return $this->__call('index', []); }
    public function show(Request $r, $id): JsonResponse { return $this->__call('show', []); }
    public function store(Request $r): JsonResponse { return $this->__call('store', []); }
    public function update(Request $r, $id): JsonResponse { return $this->__call('update', []); }
    public function destroy(Request $r, $id): JsonResponse { return $this->__call('destroy', []); }
}
