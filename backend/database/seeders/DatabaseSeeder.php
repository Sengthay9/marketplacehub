<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────────────────────
        $admin = User::firstOrCreate(['email' => 'admin@camcart.com'], [
            'name'           => 'Platform Admin',
            'username'       => 'admin@camcart',
            'password'       => Hash::make('Admin@2024'),
            'role'           => 'admin',
            'is_super_admin' => true,
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        $admin->update([
            'is_super_admin' => true,
            'username'       => 'admin@camcart',
        ]);

        // ── Categories ────────────────────────────────────────────────────────
        $categories = [
            ['slug' => 'electronics',  'name' => 'Electronics',   'icon' => '💻', 'sort_order' => 1],
            ['slug' => 'fashion',      'name' => 'Fashion',        'icon' => '👗', 'sort_order' => 2],
            ['slug' => 'home-living',  'name' => 'Home & Living',  'icon' => '🏠', 'sort_order' => 3],
            ['slug' => 'food-drinks',  'name' => 'Food & Drinks',  'icon' => '🍜', 'sort_order' => 4],
            ['slug' => 'sports',       'name' => 'Sports',         'icon' => '⚽', 'sort_order' => 5],
            ['slug' => 'books',        'name' => 'Books',          'icon' => '📚', 'sort_order' => 6],
            ['slug' => 'beauty',       'name' => 'Beauty',         'icon' => '💄', 'sort_order' => 7],
            ['slug' => 'toys',         'name' => 'Toys & Games',   'icon' => '🧸', 'sort_order' => 8],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['slug' => $cat['slug']], array_merge($cat, ['is_active' => true]));
        }
    }
}
