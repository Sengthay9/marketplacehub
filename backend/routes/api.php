<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Auth\PhoneAuthController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use App\Http\Controllers\Api\V1\Admin\AdminShopController;
use App\Http\Controllers\Api\V1\Admin\AdminProductController;
use App\Http\Controllers\Api\V1\Admin\AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\AdminReportController;
use App\Http\Controllers\Api\V1\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\V1\Vendor\VendorDashboardController;
use App\Http\Controllers\Api\V1\Vendor\VendorShopController;
use App\Http\Controllers\Api\V1\Vendor\VendorProductController;
use App\Http\Controllers\Api\V1\Vendor\VendorOrderController;
use App\Http\Controllers\Api\V1\Vendor\VendorInventoryController;
use App\Http\Controllers\Api\V1\Vendor\VendorCouponController;
use App\Http\Controllers\Api\V1\Vendor\VendorAnalyticsController;
use App\Http\Controllers\Api\V1\Vendor\VendorReviewController;
use App\Http\Controllers\Api\V1\Customer\ProductController;
use App\Http\Controllers\Api\V1\Customer\ShopController;
use App\Http\Controllers\Api\V1\Customer\CategoryController;
use App\Http\Controllers\Api\V1\Customer\CartController;
use App\Http\Controllers\Api\V1\Customer\WishlistController;
use App\Http\Controllers\Api\V1\Customer\OrderController;
use App\Http\Controllers\Api\V1\Customer\ReviewController;
use App\Http\Controllers\Api\V1\Customer\CheckoutController;
use App\Http\Controllers\Api\V1\Customer\AddressController;
use App\Http\Controllers\Api\V1\Customer\ProfileController;
use App\Http\Controllers\Api\V1\Customer\NotificationController;
use App\Http\Controllers\Api\V1\Customer\ReportController;
use App\Http\Controllers\Api\V1\Customer\SavedCardController;
use App\Http\Controllers\Api\V1\Customer\PaymentController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\Auth\VendorKycController;
use App\Http\Controllers\Api\V1\Vendor\VendorPaymentQrController;
use App\Http\Controllers\Api\V1\Admin\AdminVendorKycController;
use App\Http\Controllers\Api\V1\Admin\AdminCommissionController;
use App\Http\Controllers\Api\V1\ProfileController as SharedProfileController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('v1/health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()]));

Route::prefix('v1')->group(function () {

    // Auth (rate-limited)
    Route::prefix('auth')->group(function () {
        Route::post('register',          [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('login',             [AuthController::class, 'login'])->middleware('throttle:10,1');
        // Google OAuth
        Route::get('google',             [SocialAuthController::class, 'redirectToGoogle']);
        Route::get('google/callback',    [SocialAuthController::class, 'handleGoogleCallback']);
        // Phone OTP
        Route::post('phone/send-otp',    [PhoneAuthController::class, 'sendOtp'])->middleware('throttle:5,1');
        Route::post('phone/verify-otp',  [PhoneAuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
        Route::post('phone/register',    [PhoneAuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('forgot-password',   [PasswordResetController::class, 'sendLink'])->middleware('throttle:3,1');
        Route::post('reset-password',    [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
        // Email verification (public — user clicks link in email)
        Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->name('verification.verify');
        Route::post('email/resend',            [EmailVerificationController::class, 'resend'])->middleware('throttle:3,1');
        // Vendor KYC registration (public — no account needed yet)
        Route::post('vendor/register', [VendorKycController::class, 'register'])->middleware('throttle:3,1');
    });

    // Public catalog
    Route::get('products',            [ProductController::class, 'index']);
    Route::get('products/{slug}',     [ProductController::class, 'show']);
    Route::get('shops',                    [ShopController::class, 'index']);
    Route::get('shops/{slug}',             [ShopController::class, 'show']);
    Route::get('shops/{slug}/products',    [ShopController::class, 'products']);
    Route::get('shops/{slug}/payment-qr',  [ShopController::class, 'paymentQrCodes']);
    Route::get('categories',          [CategoryController::class, 'index']);
    Route::get('categories/{slug}',   [CategoryController::class, 'show']);
    Route::get('categories/{slug}/products', [CategoryController::class, 'products']);

    /*
    |--------------------------------------------------------------------------
    | Authenticated Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('auth/logout',   [AuthController::class, 'logout']);
        Route::get('auth/me',        [AuthController::class, 'me']);
        Route::post('auth/refresh',  [AuthController::class, 'refresh']);
        Route::patch('auth/onboard', [SocialAuthController::class, 'onboard']);

        // Shared profile update (works for any role)
        Route::put('me/profile', [SharedProfileController::class, 'update']);

        // 2FA
        Route::prefix('auth/2fa')->group(function () {
            Route::post('setup',    [TwoFactorController::class, 'setup']);
            Route::post('confirm',  [TwoFactorController::class, 'confirm']);
            Route::post('disable',  [TwoFactorController::class, 'disable']);
            Route::post('verify',   [TwoFactorController::class, 'verify']);
            Route::get('recovery',  [TwoFactorController::class, 'recoveryCodes']);
        });

        /*
        |-- Customer Routes
        */
        Route::middleware('role:customer')->prefix('customer')->group(function () {
            // Profile
            Route::get('profile',         [ProfileController::class, 'show']);
            Route::put('profile',         [ProfileController::class, 'update']);
            Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);

            // Addresses
            Route::apiResource('addresses', AddressController::class);
            Route::post('addresses/{id}/default', [AddressController::class, 'setDefault']);

            // Cart
            Route::get('cart',                         [CartController::class, 'show']);
            Route::post('cart/items',                  [CartController::class, 'addItem']);
            Route::put('cart/items/{id}',              [CartController::class, 'updateItem']);
            Route::delete('cart/items/{id}',           [CartController::class, 'removeItem']);
            Route::delete('cart',                      [CartController::class, 'clear']);

            // Wishlist
            Route::get('wishlist',                     [WishlistController::class, 'show']);
            Route::post('wishlist/items',              [WishlistController::class, 'addItem']);
            Route::delete('wishlist/items/{id}',       [WishlistController::class, 'removeItem']);
            Route::post('wishlist/items/{id}/to-cart', [WishlistController::class, 'moveToCart']);

            // Checkout
            Route::post('checkout/summary',  [CheckoutController::class, 'summary']);
            Route::post('checkout/coupon',   [CheckoutController::class, 'applyCoupon']);
            Route::post('checkout/place',    [CheckoutController::class, 'placeOrder']);

            // Orders
            Route::get('orders',             [OrderController::class, 'index']);
            Route::get('orders/{id}',        [OrderController::class, 'show']);
            Route::post('orders/{id}/cancel',[OrderController::class, 'cancel']);

            // Reviews
            Route::post('reviews',           [ReviewController::class, 'store']);
            Route::put('reviews/{id}',       [ReviewController::class, 'update']);
            Route::delete('reviews/{id}',    [ReviewController::class, 'destroy']);

            // Notifications
            Route::get('notifications',              [NotificationController::class, 'index']);
            Route::post('notifications/{id}/read',   [NotificationController::class, 'markRead']);
            Route::post('notifications/read-all',    [NotificationController::class, 'markAllRead']);

            // Payments
            Route::get('payments/{orderId}/status',   [PaymentController::class, 'status']);
            Route::post('payments/{orderId}/confirm',  [PaymentController::class, 'confirm']);

            // Saved Cards (encrypted at rest, CVV never stored)
            Route::get('cards',                [SavedCardController::class, 'index']);
            Route::post('cards',               [SavedCardController::class, 'store']);
            Route::delete('cards/{id}',        [SavedCardController::class, 'destroy']);
            Route::post('cards/{id}/default',  [SavedCardController::class, 'setDefault']);

        });
        // Reports — accessible by any authenticated user (customer OR vendor)
        Route::post('reports',      [ReportController::class, 'store']);
        Route::get('reports/mine',  [ReportController::class, 'myReports']);

        /*
        |-- Vendor Routes
        */
        Route::middleware('role:vendor')->prefix('vendor')->group(function () {
            // Shop management
            Route::get('shop',    [VendorShopController::class, 'show']);
            Route::post('shop',   [VendorShopController::class, 'create']);
            Route::put('shop',    [VendorShopController::class, 'update']);
            Route::post('shop/logo',   [VendorShopController::class, 'uploadLogo']);
            Route::post('shop/banner', [VendorShopController::class, 'uploadBanner']);

            // Dashboard & analytics
            Route::get('dashboard',                  [VendorDashboardController::class, 'index']);
            Route::get('analytics/revenue',          [VendorAnalyticsController::class, 'revenue']);
            Route::get('analytics/orders',           [VendorAnalyticsController::class, 'orders']);
            Route::get('analytics/top-products',     [VendorAnalyticsController::class, 'topProducts']);

            // Products
            Route::apiResource('products', VendorProductController::class);
            Route::post('products/{id}/images',          [VendorProductController::class, 'uploadImages']);
            Route::delete('products/{id}/images/{imgId}',[VendorProductController::class, 'deleteImage']);
            Route::post('products/{id}/variants',        [VendorProductController::class, 'addVariant']);
            Route::put('products/{id}/variants/{vId}',   [VendorProductController::class, 'updateVariant']);
            Route::delete('products/{id}/variants/{vId}',[VendorProductController::class, 'deleteVariant']);

            // Orders
            Route::get('orders',                    [VendorOrderController::class, 'index']);
            Route::get('orders/{id}',               [VendorOrderController::class, 'show']);
            Route::post('orders/{id}/confirm',      [VendorOrderController::class, 'confirm']);
            Route::post('orders/{id}/ship',         [VendorOrderController::class, 'ship']);
            Route::post('orders/{id}/deliver',      [VendorOrderController::class, 'deliver']);

            // Inventory
            Route::get('inventory',                 [VendorInventoryController::class, 'index']);
            Route::put('inventory/{id}',            [VendorInventoryController::class, 'update']);
            Route::get('inventory/low-stock',       [VendorInventoryController::class, 'lowStock']);

            // Coupons
            Route::apiResource('coupons', VendorCouponController::class);

            // Reviews
            Route::get('reviews',                        [VendorReviewController::class, 'index']);
            Route::post('reviews/{id}/reply',            [VendorReviewController::class, 'reply']);

            // Payment QR codes (vendor manages their bank QR images)
            Route::get('payment-qr',              [VendorPaymentQrController::class, 'index']);
            Route::post('payment-qr',             [VendorPaymentQrController::class, 'store']);
            Route::delete('payment-qr/{id}',      [VendorPaymentQrController::class, 'destroy']);
            Route::post('payment-qr/{id}/toggle', [VendorPaymentQrController::class, 'toggle']);
        });

        /*
        |-- Admin Routes
        */
        Route::middleware('role:admin')->prefix('admin')->group(function () {
            // Dashboard
            Route::get('dashboard', [AdminDashboardController::class, 'index']);

            // User-submitted reports (inbox)
            Route::get('reports',                  [AdminReportController::class, 'index']);
            Route::get('reports/{id}',             [AdminReportController::class, 'show']);
            Route::patch('reports/{id}/status',    [AdminReportController::class, 'updateStatus']);
            Route::post('reports/{id}/read',       [AdminReportController::class, 'markRead']);
            Route::delete('reports/{id}',          [AdminReportController::class, 'destroy']);

            // Users
            Route::apiResource('users', AdminUserController::class)->except(['store']);
            Route::post('users/{id}/warn',    [AdminUserController::class, 'warn']);
            Route::post('users/{id}/suspend', [AdminUserController::class, 'suspend']);
            Route::post('users/{id}/ban',     [AdminUserController::class, 'ban']);
            Route::post('users/{id}/unban',   [AdminUserController::class, 'unban']);

            // Shops
            Route::apiResource('shops', AdminShopController::class)->except(['store']);
            Route::post('shops/{id}/approve',  [AdminShopController::class, 'approve']);
            Route::post('shops/{id}/reject',   [AdminShopController::class, 'reject']);
            Route::post('shops/{id}/warn',     [AdminShopController::class, 'warn']);
            Route::post('shops/{id}/suspend',  [AdminShopController::class, 'suspend']);
            Route::post('shops/{id}/ban',      [AdminShopController::class, 'ban']);
            Route::post('shops/{id}/unban',    [AdminShopController::class, 'unban']);

            // Products
            Route::apiResource('products', AdminProductController::class)->except(['store']);
            Route::post('products/{id}/approve',  [AdminProductController::class, 'approve']);
            Route::post('products/{id}/reject',   [AdminProductController::class, 'reject']);
            Route::post('products/{id}/warn',     [AdminProductController::class, 'warn']);
            Route::post('products/{id}/suspend',  [AdminProductController::class, 'suspend']);
            Route::post('products/{id}/ban',      [AdminProductController::class, 'ban']);
            Route::post('products/{id}/unban',    [AdminProductController::class, 'unban']);

            // Categories
            Route::apiResource('categories', AdminCategoryController::class);

            // Coupons
            Route::apiResource('coupons', AdminCouponController::class);

            // Analytics
            Route::get('analytics', [AdminAnalyticsController::class, 'index']);

            // Commissions
            Route::get('commissions',                      [AdminCommissionController::class, 'index']);
            Route::get('commissions/summary',              [AdminCommissionController::class, 'summary']);
            Route::post('commissions/calculate',           [AdminCommissionController::class, 'calculate']);
            Route::post('commissions/mark-all-paid',       [AdminCommissionController::class, 'markAllPaid']);
            Route::post('commissions/mark-all-paid-year', [AdminCommissionController::class, 'markAllPaidYear']);
            Route::post('commissions/send-all-invoices',   [AdminCommissionController::class, 'sendAllInvoices']);
            Route::post('commissions/send-all-invoices-year', [AdminCommissionController::class, 'sendAllInvoicesYear']);
            Route::post('commissions/{id}/paid',           [AdminCommissionController::class, 'markPaid']);
            Route::post('commissions/{id}/send-invoice',   [AdminCommissionController::class, 'sendInvoice']);
            Route::get('commissions/{id}/invoice-preview', [AdminCommissionController::class, 'previewInvoice']);


            // Vendor KYC Review
            Route::get('vendor-kyc',            [AdminVendorKycController::class, 'index']);
            Route::get('vendor-kyc/{id}',        [AdminVendorKycController::class, 'show']);
            Route::post('vendor-kyc/{id}/approve', [AdminVendorKycController::class, 'approve']);
            Route::post('vendor-kyc/{id}/reject',  [AdminVendorKycController::class, 'reject']);
        });
    });
});
