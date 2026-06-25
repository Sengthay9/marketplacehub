<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->orderByDesc('id')->get();
        return response()->json(['data' => $addresses]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label'          => 'sometimes|string|max:50',
            'recipient_name' => 'required|string|max:150',
            'phone'          => 'required|string|max:20',
            'street'         => 'required|string|max:255',
            'city'           => 'required|string|max:100',
            'state'          => 'nullable|string|max:100',
            'postal_code'    => 'sometimes|string|max:20',
            'country'        => 'sometimes|string|max:3',
            'latitude'       => 'nullable|numeric|between:-90,90',
            'longitude'      => 'nullable|numeric|between:-180,180',
        ]);

        $user = $request->user();

        if ($user->addresses()->count() === 0) {
            $data['is_default'] = true;
        }

        $address = $user->addresses()->create($data);

        return response()->json(['data' => $address, 'message' => 'Address saved.'], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        return response()->json(['data' => $address]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        $data = $request->validate([
            'label'          => 'sometimes|string|max:50',
            'recipient_name' => 'sometimes|string|max:150',
            'phone'          => 'sometimes|string|max:20',
            'street'         => 'sometimes|string|max:255',
            'city'           => 'sometimes|string|max:100',
            'state'          => 'nullable|string|max:100',
            'postal_code'    => 'nullable|string|max:20',
            'country'        => 'nullable|string|max:3',
            'latitude'       => 'nullable|numeric|between:-90,90',
            'longitude'      => 'nullable|numeric|between:-180,180',
        ]);

        $address->update($data);

        return response()->json(['data' => $address, 'message' => 'Address updated.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $request->user()->addresses()->orderByDesc('id')->first()?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Address deleted.']);
    }

    public function setDefault(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $user->addresses()->update(['is_default' => false]);
        $user->addresses()->findOrFail($id)->update(['is_default' => true]);

        return response()->json(['message' => 'Default address updated.']);
    }
}
