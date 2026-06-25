# CamCart — MarketplaceHub

> Multi-Vendor E-Commerce Marketplace for Cambodia

---

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| State       | Zustand, TanStack Query (React Query) |
| Forms       | React Hook Form |
| Backend     | Laravel 12, PHP 8.4+ |
| Auth        | Laravel Sanctum (Bearer Token) |
| Database    | PostgreSQL 16 |
| Cache       | Redis 7 |
| Storage     | Local disk (nginx serves `/storage/`) |
| Queue       | Redis + Laravel Queue Workers |
| Deploy      | Docker + Docker Compose + Nginx |

---

## User Roles

| Role     | Description |
|----------|-------------|
| Admin    | Full platform control — users, vendors, KYC, products, categories, coupons, payouts, analytics, site settings |
| Vendor   | Shop owner — manage shop, products, inventory, orders & payouts, coupons, reviews, notifications, support |
| Customer | Buyer — browse, cart, wishlist, checkout, order tracking, shop favorites, reviews, support |

---

## Quick Start

### Prerequisites
- Docker 24+
- Docker Compose v2

### 1. Start all services

```bash
cd ~/Desktop/Marketplacehub
docker-compose up -d
```

### 2. Run migrations & seed

```bash
docker exec mh_backend php artisan migrate --seed
```

### 3. Access

| Service  | URL |
|----------|-----|
| Frontend | http://localhost |
| API      | http://localhost/api/v1 |

### Demo Accounts

| Role     | Username / Email         | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@marketplacehub.com | Admin@2024   |
| Vendor   | vendor@camcart           | vendor@2024  |
| Customer | customer@camcart         | customer@2024 |

> Login uses **username** for vendors/customers and **email** for admin.

---

## Deployment

**Frontend changes** require a full rebuild:

```bash
docker-compose build frontend && docker-compose up -d frontend
```

**Backend (PHP) changes** apply instantly via docker cp:

```bash
docker cp backend/app/path/File.php mh_backend:/var/www/html/app/path/File.php
```

**Run migrations:**

```bash
docker exec mh_backend php artisan migrate
```

**View backend logs:**

```bash
docker exec mh_backend tail -100 /var/www/html/storage/logs/laravel.log
```

**Check containers:**

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Features

### Customer
- **Homepage**: Hero section, featured products, featured shops, mega category menu
- **Browse & Search**: Product listing with category, price, sort, search filters
- **Product Detail**: Images, variants, star rating, reviews, share button, add to cart
- **Cart**: Multi-vendor cart grouping, quantity update, remove
- **Wishlist**: Save products (heart icon), view at `/wishlist` (Products + Shops tabs)
- **Shop Favorites**: Favorite button on shop page, shop tab in wishlist
- **Checkout**:
  - Delivery address: pick saved address or add new with map picker
  - Payment methods: COD / QR Bank Transfer (Bakong, ABA, ACLEDA)
  - Coupon code discount
  - Order summary: subtotal, discount, total
- **QR Payment**: Shows vendor QR image after order, 15-min timer, "I've paid" confirm
- **Order Tracking**: Order status + payment status in `/account`
- **Reviews**: Star rating + comment on products and shops
- **Support**: Contact admin for help via `/support`
- **Account** (`/account`): Profile, Orders, Addresses, Payment methods

### Vendor
- **Dashboard**: Revenue, orders, top products analytics
- **Orders & Payouts** (`/vendor/payouts`):
  - All / Pending / Confirmed / Cancelled order tabs
  - Click any order to expand with full detail + delivery map
  - **Await tab**: Payout bills pending admin transfer (shows order #, fee %)
  - **Receive tab**: Completed payouts (shows amount received, Bakong receipt detail)
  - Bakong receipt: Order total, fee charged, amount received, reference #, transfer date
- **My Shop**: Edit shop info, logo, banner, open/close toggle
- **Products**: CRUD with images, variants, stock, pricing, discount
- **Inventory**: Simple product catalog — one image per product, name, category, description
- **Coupons**: Create discount codes (%, fixed, free shipping), usage limits
- **Reviews**:
  - **Shop Reviews tab**: See and reply to customer shop reviews
  - **Product Reviews tab**: See and reply to product reviews, delete
  - Sub-filters: All / Newest / Replied
- **Notifications**: Typed notifications including payout completed alerts
- **Contact Admin** (`/vendor/support`): Submit support tickets to admin
- **Settings**:
  - Read-only profile (name, username, phone, email)
  - Appearance: Light / Dark / System theme + language (English / Khmer)
  - Payment: link to payment QR setup
  - Change Password + Forgot Password
- **Payment QR** (`/vendor/payment`): Upload Bakong/ABA/ACLEDA QR images per currency

### Admin
- **Dashboard**: Platform-wide analytics — GMV, revenue, users, orders
- **Users**: View, suspend, manage all users
- **Vendors**: List all vendors, view shop details
- **KYC Approval**: Review vendor KYC documents (ID + selfie), approve or reject
- **Products**: Approve / reject / suspend products
- **Categories**: CRUD with icons
- **Coupons**: Platform-wide coupon management
- **Payouts** (`/admin/payouts`): View all vendor payout bills, complete or bulk-complete (sends notification to vendor)
- **Bank Account** (`/admin/bank-account`): Set up admin Bakong account for payout transfers
- **Website Settings**: Configure site name, logo, and platform settings
- **Reports**: Revenue, order, and user reports

---

## Payout Flow

```
Customer pays order
        │
        ▼
PaymentObserver auto-creates Payout record (status: pending)
        │
        ▼
Vendor sees bill in "Await" tab (Orders & Payouts)
        │
        ▼
Admin reviews payout in /admin/payouts
Admin completes payout → transfers via Bakong
        │
        ▼
Payout status → "completed"
Vendor receives notification: "Payout Transferred"
Vendor sees bill in "Receive" tab with Bakong receipt details
```

---

## Platform Fee Tiers

| Order Total | Fee Rate |
|-------------|----------|
| ≤ $50       | 5%       |
| $51 – $150  | 8%       |
| $151 – $300 | 10%      |
| > $300      | 15%      |

Fee is deducted from vendor payout. Customers see only the order total.

---

## Order Status Flow

```
pending → confirmed → processing → delivered
                   ↘
               cancelled / refunded
```

Vendor confirms payment received → order moves to confirmed → vendor marks delivered.

---

## Multi-Language

The app supports **English** and **Khmer (ខ្មែរ)**. Toggle via the language switcher in the navbar or vendor/admin settings. Translation is handled by `useLangStore` (Zustand) + the `i18n.ts` dictionary.

---

## Project Structure

```
Marketplacehub/
├── docker-compose.yml
├── nginx/nginx.conf
│
├── backend/                              ← Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── Admin/
│   │   │   │   ├── AdminPayoutController.php
│   │   │   │   ├── AdminBankAccountController.php
│   │   │   │   ├── AdminSiteSettingController.php
│   │   │   │   └── ...
│   │   │   ├── Vendor/
│   │   │   │   ├── VendorPayoutController.php
│   │   │   │   ├── VendorPaymentQrController.php
│   │   │   │   ├── VendorReviewController.php
│   │   │   │   └── ...
│   │   │   └── Customer/
│   │   │       ├── PaymentController.php
│   │   │       ├── ShopController.php
│   │   │       └── ...
│   │   ├── Models/
│   │   │   ├── Payout.php              ← gross_amount, vendor_amount, platform_fee, status
│   │   │   ├── ProductImage.php        ← $appends = ['url'] (computed from path)
│   │   │   ├── VendorBankAccount.php
│   │   │   ├── AdminBankAccount.php
│   │   │   └── ...
│   │   ├── Observers/
│   │   │   └── PaymentObserver.php     ← auto-creates Payout on payment completion
│   │   └── Services/
│   │       └── KhqrService.php         ← Bakong QR generation
│   └── routes/api.php
│
└── frontend/src/
    ├── app/
    │   ├── (admin)/admin/
    │   │   ├── payouts/
    │   │   ├── bank-account/
    │   │   └── ...
    │   ├── (vendor)/vendor/
    │   │   ├── payouts/                ← Orders & Payouts
    │   │   ├── support/
    │   │   ├── notifications/
    │   │   └── payment/
    │   └── (customer)/
    │       └── support/
    ├── features/
    │   ├── vendor/
    │   │   ├── VendorPayouts.tsx       ← combined orders + payout bills
    │   │   ├── VendorReviews.tsx       ← shop + product review tabs
    │   │   ├── VendorSettings.tsx      ← theme, language, password
    │   │   ├── VendorNotifications.tsx
    │   │   └── VendorSupport.tsx
    │   ├── admin/
    │   │   ├── AdminPayouts.tsx
    │   │   ├── AdminBankAccount.tsx
    │   │   └── AdminWebsiteSettings.tsx
    │   ├── shops/
    │   │   └── ShopDetailView.tsx      ← banner, logo, 5-star rating, favorite
    │   └── products/
    │       └── ProductCard.tsx         ← reads image_url from API
    ├── store/
    │   ├── auth.store.ts
    │   ├── cart.store.ts
    │   ├── lang.store.ts               ← English / Khmer
    │   └── notification.store.ts
    └── lib/
        ├── i18n.ts                     ← translation dictionary
        └── axios.ts
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login → Bearer token (accepts username or email) |
| POST | `/api/v1/auth/logout` | Logout |
| GET  | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/auth/forgot-password` | Send reset email |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products (search, filter, sort, paginate) |
| GET | `/api/v1/products/:slug` | Product detail with images + reviews |
| GET | `/api/v1/shops` | List shops |
| GET | `/api/v1/shops/:slug` | Shop detail |
| GET | `/api/v1/shops/:slug/reviews` | Shop reviews |
| GET | `/api/v1/categories` | Category tree |

### Customer (Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/v1/customer/cart/...` | Cart |
| GET/POST/DELETE | `/api/v1/customer/wishlist/...` | Wishlist |
| POST | `/api/v1/customer/shops/:slug/favorite` | Toggle shop favorite |
| POST | `/api/v1/customer/checkout/place` | Place order |
| GET  | `/api/v1/customer/orders` | Order history |
| POST | `/api/v1/customer/payments/:orderId/confirm` | Confirm QR payment made |
| GET/POST/DELETE | `/api/v1/customer/addresses/...` | Addresses |
| POST | `/api/v1/customer/reviews` | Submit product review |
| POST | `/api/v1/customer/shops/:slug/reviews` | Submit shop review |

### Vendor (Bearer token + vendor role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/dashboard` | Analytics |
| CRUD | `/api/v1/vendor/products` | Products |
| POST | `/api/v1/vendor/products/:id/images` | Upload product image |
| DELETE | `/api/v1/vendor/products/:id/images/:imgId` | Delete product image |
| GET | `/api/v1/vendor/orders` | Orders list |
| POST | `/api/v1/vendor/orders/:id/confirm-payment` | Confirm payment received |
| POST | `/api/v1/vendor/orders/:id/reject-payment` | Reject → cancel + refund |
| GET | `/api/v1/vendor/payouts` | Payout bills |
| CRUD | `/api/v1/vendor/payment-qr` | QR payment images |
| GET | `/api/v1/vendor/shop-reviews` | Shop reviews |
| POST | `/api/v1/vendor/shop-reviews/:id/reply` | Reply to shop review |
| GET | `/api/v1/vendor/reviews` | Product reviews |
| POST | `/api/v1/vendor/reviews/:id/reply` | Reply to product review |

### Admin (Bearer token + admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Platform analytics |
| GET/POST | `/api/v1/admin/payouts` | Payout management |
| POST | `/api/v1/admin/payouts/:id/complete` | Complete payout (notifies vendor) |
| POST | `/api/v1/admin/payouts/bulk-complete` | Bulk complete payouts |
| CRUD | `/api/v1/admin/bank-account` | Admin bank account |
| POST | `/api/v1/admin/shops/:id/approve` | Approve shop |
| POST | `/api/v1/admin/shops/:id/reject` | Reject shop |
| POST | `/api/v1/admin/products/:id/approve` | Approve product |
| CRUD | `/api/v1/admin/categories` | Categories |
| CRUD | `/api/v1/admin/coupons` | Coupons |
| CRUD | `/api/v1/admin/users` | Users |
| GET/PUT | `/api/v1/admin/site-settings` | Website settings |

---

## Known Gotchas

1. **Product images**: `ProductImage` stores `path`, computes `url` via accessor with `$appends = ['url']`. Frontend reads `image.url`. Do not remove `$appends` or images break everywhere.

2. **Next.js `<Image>` in Docker**: The optimizer fetches through `localhost:3000` inside the container which can't reach nginx `/storage/`. Use plain `<img>` tags with `onError` fallback for product images, shop logos/banners, and QR codes.

3. **Frontend rebuild required**: `docker-compose restart` does NOT apply new Next.js code. Always `docker-compose build frontend && docker-compose up -d frontend`.

4. **Login uses username**: Vendors and customers log in with username (e.g. `vendor@camcart`), not email.

5. **Order relationship**: `Order` model uses `customer()` not `user()` for the buyer relationship.

6. **PaymentObserver**: Auto-creates a `Payout` record when `Payment` status changes to `completed`. Don't create payouts manually or duplicates will result.

---

## Security

- Sanctum Bearer Token authentication
- Role-based middleware on all protected routes
- Input validation: Zod (frontend) + Laravel FormRequest (backend)
- File upload validation (MIME type + size limits)
- SQL injection prevention via Eloquent ORM
- Passwords hashed with bcrypt
- CORS configured for frontend origin only
- Rate limiting on auth routes

---

*Last updated: 2026-06-25*
