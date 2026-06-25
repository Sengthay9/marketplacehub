<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminSiteSettingController extends Controller
{
    private function withUrl(SiteSetting $s): array
    {
        return [
            'site_name' => $s->site_name,
            'logo_url'  => $s->logo_path ? Storage::disk('public')->url($s->logo_path) : null,
        ];
    }

    public function show(): JsonResponse
    {
        return response()->json($this->withUrl(SiteSetting::current()));
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'site_name' => 'sometimes|string|max:100',
            'logo'      => 'nullable|image|max:2048',
        ]);

        $setting = SiteSetting::current();

        if ($request->filled('site_name')) {
            $setting->site_name = $request->site_name;
        }

        if ($request->hasFile('logo')) {
            if ($setting->logo_path) {
                Storage::disk('public')->delete($setting->logo_path);
            }
            $setting->logo_path = $request->file('logo')->store('site', 'public');
        }

        $setting->save();

        return response()->json($this->withUrl($setting));
    }

    public function removeLogo(): JsonResponse
    {
        $setting = SiteSetting::current();
        if ($setting->logo_path) {
            Storage::disk('public')->delete($setting->logo_path);
            $setting->logo_path = null;
            $setting->save();
        }
        return response()->json($this->withUrl($setting));
    }
}
