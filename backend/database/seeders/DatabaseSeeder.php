<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Models\VendorPaymentQrCode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────────────────────
        $admin = User::firstOrCreate(['email' => 'admin@marketplacehub.com'], [
            'name'           => 'Platform Admin',
            'password'       => Hash::make('Admin@2024'),
            'role'           => 'admin',
            'is_super_admin' => true,
            'email_verified' => true,
        ]);
        // Ensure existing admin gets super admin flag after migration
        if (! $admin->is_super_admin) {
            $admin->update(['is_super_admin' => true]);
        }

        // ── Demo Customer ──────────────────────────────────────────────────────
        User::firstOrCreate(['email' => 'customer@demo.com'], [
            'name'           => 'Alice Demouser',
            'password'       => Hash::make('Demo@2024'),
            'role'           => 'customer',
            'phone'          => '0961234567',
            'email_verified' => true,
        ]);

        // ── Categories ────────────────────────────────────────────────────────
        $electronics = Category::firstOrCreate(['slug' => 'electronics'], [
            'name' => 'Electronics', 'icon' => '💻', 'is_active' => true, 'sort_order' => 1,
        ]);
        $fashion = Category::firstOrCreate(['slug' => 'fashion'], [
            'name' => 'Fashion', 'icon' => '👗', 'is_active' => true, 'sort_order' => 2,
        ]);
        $home = Category::firstOrCreate(['slug' => 'home-living'], [
            'name' => 'Home & Living', 'icon' => '🏠', 'is_active' => true, 'sort_order' => 3,
        ]);
        $food = Category::firstOrCreate(['slug' => 'food-drinks'], [
            'name' => 'Food & Drinks', 'icon' => '🍜', 'is_active' => true, 'sort_order' => 4,
        ]);
        $sports = Category::firstOrCreate(['slug' => 'sports'], [
            'name' => 'Sports', 'icon' => '⚽', 'is_active' => true, 'sort_order' => 5,
        ]);
        $books = Category::firstOrCreate(['slug' => 'books'], [
            'name' => 'Books', 'icon' => '📚', 'is_active' => true, 'sort_order' => 6,
        ]);

        // ── Demo Vendor (README account) ──────────────────────────────────────
        $vendorDemo = User::firstOrCreate(['email' => 'vendor@demo.com'], [
            'name'           => 'Demo Vendor',
            'password'       => Hash::make('Demo@2024'),
            'role'           => 'vendor',
            'phone'          => '0901234567',
            'email_verified' => true,
        ]);
        $shopDemo = Shop::firstOrCreate(['user_id' => $vendorDemo->id], [
            'name'        => 'Demo General Store',
            'slug'        => 'demo-general-store',
            'description' => 'A general merchandise store with a wide variety of products.',
            'contact_number' => '0901234567',
            'email'       => 'vendor@demo.com',
            'address'     => 'Phnom Penh, Daun Penh',
            'status'      => 'approved',
            'rating'      => 4.3,
            'review_count'=> 45,
        ]);
        $this->seedProducts($shopDemo, $home, [
            ['name' => 'Bamboo Cutting Board Set',     'price' => 22.00, 'stock' => 80],
            ['name' => 'Ceramic Coffee Mug 350ml',     'price' => 8.00,  'stock' => 200, 'featured' => true],
            ['name' => 'Wicker Storage Basket Large',  'price' => 18.00, 'stock' => 60],
            ['name' => 'LED Desk Lamp with USB Port',  'price' => 35.00, 'stock' => 45, 'featured' => true],
        ]);

        // ── Vendor 1: Tech World Store ─────────────────────────────────────────
        $vendor1 = User::firstOrCreate(['email' => 'vendor1@demo.com'], [
            'name'           => 'Sokha Meas',
            'password'       => Hash::make('Vendor@2024'),
            'role'           => 'vendor',
            'phone'          => '0971112222',
            'email_verified' => true,
        ]);
        $shop1 = Shop::firstOrCreate(['user_id' => $vendor1->id], [
            'name'           => 'Tech World Store',
            'slug'           => 'tech-world-store',
            'description'    => 'Your one-stop shop for the latest electronics, gadgets, and accessories.',
            'contact_number' => '0971112222',
            'email'          => 'vendor1@demo.com',
            'address'        => 'Phnom Penh, Toul Kork',
            'status'         => 'approved',
            'rating'         => 4.7,
            'review_count'   => 120,
        ]);

        $this->seedProducts($shop1, $electronics, [
            ['name' => 'Samsung Galaxy A55 5G',       'price' => 389.00, 'stock' => 30, 'featured' => true],
            ['name' => 'Xiaomi Redmi Note 13',         'price' => 199.00, 'stock' => 50],
            ['name' => 'Apple AirPods Pro (2nd Gen)',  'price' => 249.00, 'stock' => 25, 'featured' => true],
            ['name' => 'Anker USB-C Charging Hub 7-in-1', 'price' => 45.00, 'stock' => 80],
            ['name' => 'Sony WH-1000XM5 Headphones',  'price' => 279.00, 'stock' => 20],
            ['name' => 'iPad 10th Generation 64GB',   'price' => 449.00, 'stock' => 15],
        ]);

        // Vendor 1 QR codes (no real images in seed — use placeholder path)
        $this->seedQrCodes($shop1, [
            ['bank_name' => 'aba',    'bank_label' => 'ABA Pay',     'currency' => 'usd', 'account_name' => 'SOKHA MEAS'],
            ['bank_name' => 'aba',    'bank_label' => 'ABA Pay',     'currency' => 'khr', 'account_name' => 'SOKHA MEAS'],
            ['bank_name' => 'bakong', 'bank_label' => 'Bakong KHQR', 'currency' => 'usd', 'account_name' => 'SOKHA MEAS'],
        ]);

        // ── Vendor 2: Fashion House ─────────────────────────────────────────────
        $vendor2 = User::firstOrCreate(['email' => 'vendor2@demo.com'], [
            'name'           => 'Channary Rin',
            'password'       => Hash::make('Vendor@2024'),
            'role'           => 'vendor',
            'phone'          => '0883334444',
            'email_verified' => true,
        ]);
        $shop2 = Shop::firstOrCreate(['user_id' => $vendor2->id], [
            'name'           => 'Fashion House KH',
            'slug'           => 'fashion-house-kh',
            'description'    => 'Trendy Cambodian and international fashion for men and women.',
            'contact_number' => '0883334444',
            'email'          => 'vendor2@demo.com',
            'address'        => 'Phnom Penh, BKK1',
            'status'         => 'approved',
            'rating'         => 4.5,
            'review_count'   => 88,
        ]);

        $this->seedProducts($shop2, $fashion, [
            ['name' => 'Silk Krama Scarf (Traditional)',   'price' => 18.00,  'stock' => 200, 'featured' => true],
            ['name' => 'Men\'s Linen Summer Shirt',        'price' => 25.00,  'stock' => 150],
            ['name' => 'Women\'s Floral Wrap Dress',       'price' => 35.00,  'stock' => 100, 'featured' => true],
            ['name' => 'Leather Crossbody Bag',            'price' => 55.00,  'stock' => 60],
            ['name' => 'Handmade Silver Anklet',           'price' => 12.00,  'stock' => 300],
            ['name' => 'Kids Khmer Costume Set',           'price' => 29.00,  'stock' => 75],
        ]);

        $this->seedQrCodes($shop2, [
            ['bank_name' => 'acleda', 'bank_label' => 'ACLEDA Pay',   'currency' => 'usd', 'account_name' => 'CHANNARY RIN'],
            ['bank_name' => 'acleda', 'bank_label' => 'ACLEDA Pay',   'currency' => 'khr', 'account_name' => 'CHANNARY RIN'],
            ['bank_name' => 'bakong', 'bank_label' => 'Bakong KHQR',  'currency' => 'khr', 'account_name' => 'CHANNARY RIN'],
        ]);

        // ── Vendor 3: Fresh Market ──────────────────────────────────────────────
        $vendor3 = User::firstOrCreate(['email' => 'vendor3@demo.com'], [
            'name'           => 'Virak Pov',
            'password'       => Hash::make('Vendor@2024'),
            'role'           => 'vendor',
            'phone'          => '0765556666',
            'email_verified' => true,
        ]);
        $shop3 = Shop::firstOrCreate(['user_id' => $vendor3->id], [
            'name'           => 'Fresh Market KH',
            'slug'           => 'fresh-market-kh',
            'description'    => 'Organic produce, local snacks, and traditional Cambodian food products.',
            'contact_number' => '0765556666',
            'email'          => 'vendor3@demo.com',
            'address'        => 'Siem Reap, Pub Street Area',
            'status'         => 'approved',
            'rating'         => 4.8,
            'review_count'   => 215,
        ]);

        $this->seedProducts($shop3, $food, [
            ['name' => 'Kampot Pepper (Black) 250g',   'price' => 8.50,  'stock' => 500, 'featured' => true],
            ['name' => 'Organic Palm Sugar 500g',      'price' => 5.00,  'stock' => 400],
            ['name' => 'Dried Mango Strips 200g',      'price' => 6.00,  'stock' => 300, 'featured' => true],
            ['name' => 'Fish Sauce Premium 700ml',     'price' => 4.50,  'stock' => 600],
            ['name' => 'Jasmine Rice 5kg Bag',         'price' => 12.00, 'stock' => 200],
            ['name' => 'Kuy Teav Soup Mix Pack',       'price' => 3.50,  'stock' => 250],
        ]);

        $this->seedQrCodes($shop3, [
            ['bank_name' => 'aba',    'bank_label' => 'ABA Pay',      'currency' => 'usd', 'account_name' => 'VIRAK POV'],
            ['bank_name' => 'bakong', 'bank_label' => 'Bakong KHQR',  'currency' => 'usd', 'account_name' => 'VIRAK POV'],
            ['bank_name' => 'bakong', 'bank_label' => 'Bakong KHQR',  'currency' => 'khr', 'account_name' => 'VIRAK POV'],
        ]);

        // ── Vendor 4: Sports & Fitness Hub ─────────────────────────────────────
        $vendor4 = User::firstOrCreate(['email' => 'vendor4@demo.com'], [
            'name'           => 'Dara Kong',
            'password'       => Hash::make('Vendor@2024'),
            'role'           => 'vendor',
            'phone'          => '0123456789',
            'email_verified' => true,
        ]);
        $shop4 = Shop::firstOrCreate(['user_id' => $vendor4->id], [
            'name'        => 'Sports & Fitness Hub',
            'slug'        => 'sports-fitness-hub',
            'description' => 'Everything you need for an active lifestyle — gear, apparel, and supplements.',
            'contact_number' => '0123456789',
            'email'       => 'vendor4@demo.com',
            'address'     => 'Phnom Penh, Chbar Ampov',
            'status'      => 'approved',
            'rating'      => 4.6,
            'review_count'=> 74,
        ]);
        $this->seedProducts($shop4, $sports, [
            ['name' => 'Running Shoes Nike Air Zoom',  'price' => 89.00,  'stock' => 40, 'featured' => true],
            ['name' => 'Yoga Mat Premium 6mm',         'price' => 28.00,  'stock' => 100],
            ['name' => 'Resistance Bands Set (5 pcs)', 'price' => 15.00,  'stock' => 150, 'featured' => true],
            ['name' => 'Protein Shaker Bottle 700ml',  'price' => 10.00,  'stock' => 200],
            ['name' => 'Adjustable Dumbbell 20kg',     'price' => 55.00,  'stock' => 30],
        ]);

        // ── Vendor 5: Book Haven ────────────────────────────────────────────────
        $vendor5 = User::firstOrCreate(['email' => 'vendor5@demo.com'], [
            'name'           => 'Sreyleap Im',
            'password'       => Hash::make('Vendor@2024'),
            'role'           => 'vendor',
            'phone'          => '0987654321',
            'email_verified' => true,
        ]);
        $shop5 = Shop::firstOrCreate(['user_id' => $vendor5->id], [
            'name'        => 'Book Haven KH',
            'slug'        => 'book-haven-kh',
            'description' => 'Books, stationery, and educational materials for all ages.',
            'contact_number' => '0987654321',
            'email'       => 'vendor5@demo.com',
            'address'     => 'Phnom Penh, Toul Tom Poung',
            'status'      => 'approved',
            'rating'      => 4.9,
            'review_count'=> 132,
        ]);
        $this->seedProducts($shop5, $books, [
            ['name' => 'Khmer History Encyclopedia',    'price' => 24.00, 'stock' => 60, 'featured' => true],
            ['name' => 'English-Khmer Dictionary',      'price' => 12.00, 'stock' => 120],
            ['name' => 'Children Khmer Story Book Set', 'price' => 18.00, 'stock' => 80, 'featured' => true],
            ['name' => 'A4 Premium Notebook 200 Pages', 'price' => 5.00,  'stock' => 500],
            ['name' => 'Watercolor Painting Kit',       'price' => 32.00, 'stock' => 45],
        ]);
    }

    private function seedProducts(Shop $shop, Category $category, array $items): void
    {
        foreach ($items as $item) {
            $slug = Str::slug($item['name']);
            Product::firstOrCreate(['slug' => $slug], [
                'shop_id'        => $shop->id,
                'category_id'    => $category->id,
                'name'           => $item['name'],
                'slug'           => $slug,
                'sku'            => strtoupper(Str::random(8)),
                'description'    => "High quality {$item['name']} available at {$shop->name}.",
                'price'          => $item['price'],
                'discount_price' => isset($item['discount']) ? $item['discount'] : null,
                'stock_quantity' => $item['stock'],
                'is_featured'    => $item['featured'] ?? false,
                'status'         => 'published',
                'rating'         => round(4.0 + (mt_rand(0, 9) / 10), 1),
                'review_count'   => mt_rand(5, 60),
                'sold_count'     => mt_rand(10, 200),
            ]);
        }
    }

    /** Seed placeholder QR codes (no real image — vendors upload their own via dashboard). */
    private function seedQrCodes(Shop $shop, array $qrItems): void
    {
        foreach ($qrItems as $qr) {
            if ($shop->paymentQrCodes()->where('bank_name', $qr['bank_name'])->where('currency', $qr['currency'])->exists()) {
                continue;
            }
            // Use a placeholder SVG path — real image upload happens via vendor dashboard
            $shop->paymentQrCodes()->create([
                'bank_name'     => $qr['bank_name'],
                'bank_label'    => $qr['bank_label'],
                'currency'      => $qr['currency'],
                'qr_image_path' => "qr_codes/placeholder_{$qr['bank_name']}_{$qr['currency']}.png",
                'account_name'  => $qr['account_name'],
                'is_active'     => true,
            ]);
        }
    }
}
