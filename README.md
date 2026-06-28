# CamCart — MarketplaceHub

> Cambodia's Multi-Vendor E-Commerce Marketplace — built with Next.js 15 + Laravel 12

---

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI |
| State       | Zustand, TanStack Query (React Query) |
| Forms       | React Hook Form + Zod validation |
| Backend     | Laravel 12, PHP 8.4+ |
| Auth        | Laravel Sanctum (Bearer Token), Google OAuth, Firebase Phone Auth, 2FA |
| Database    | PostgreSQL 16 |
| Cache       | Redis 7 |
| Queue       | Redis + Laravel Queue Workers |
| Real-time   | Pusher + Laravel Echo (WebSocket) |
| Storage     | Local disk (nginx serves `/storage/`) |
| Deploy      | Docker + Docker Compose + Nginx |

---

## User Roles

| Role     | Description |
|----------|-------------|
| Admin    | Full platform control — users, vendors, KYC, products, categories, coupons, payouts, commissions, analytics, site settings, reports |
| Vendor   | Shop owner — manage shop, products, inventory, orders & payouts, coupons, reviews, notifications, support, payment QR |
| Customer | Buyer — browse, cart, wishlist, checkout, order tracking, shop favorites, reviews, support |

---

## Quick Start

### Prerequisites
- Docker 24+
- Docker Compose v2

### 1. Clone & configure environment

```bash
git clone https://github.com/Sengthay9/marketplacehub.git
cd marketplacehub
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

### 2. Start all services

```bash
docker-compose up -d
```

### 3. Run migrations & seed

```bash
docker exec mh_backend php artisan migrate --seed
```

### 4. Access

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost |
| API       | http://localhost/api/v1 |

### Demo Accounts

| Role     | Username         | Password      |
|----------|------------------|---------------|
| Admin    | admin@camcart    | Admin@2024    |
| Vendor   | vendor@camcart   | vendor@2024   |
| Customer | customer@camcart | customer@2024 |

> All roles log in with **username**.

---

## Deployment

**Frontend changes** require a full image rebuild:

```bash
docker-compose build frontend && docker-compose up -d --no-deps frontend
```

**Backend (PHP) changes** apply instantly via docker cp:

```bash
docker cp backend/app/Http/Controllers/Api/V1/Vendor/VendorShopController.php \
  mh_backend:/var/www/html/app/Http/Controllers/Api/V1/Vendor/VendorShopController.php
```

**Run new migrations:**

```bash
docker exec mh_backend php artisan migrate
```

**Useful commands:**

```bash
# View backend logs
docker exec mh_backend tail -200 /var/www/html/storage/logs/laravel.log

# Restart queue workers
docker-compose restart queue

# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## Features

### Customer

- **Homepage**: Hero banner, featured products grid, featured shops carousel, mega category menu
- **Browse & Search**: Product listing with category, price range, sort, keyword search filters
- **Product Detail**: Image gallery, variants (size/color/etc.), star rating, YouTube-style reviews (`@username`, relative time, inline stars), share button, add to cart
- **Cart**: Multi-vendor cart grouped by shop, quantity update, item remove
- **Wishlist**: Heart icon on any product or shop, view at `/wishlist` (Products tab + Shops tab)
- **Shop Favorites**: Favorite button on shop banner (top-right), listed under Shops tab in wishlist
- **Checkout**:
  - Delivery address — pick saved address or add new with interactive map picker
  - Payment methods — COD or QR Bank Transfer (Bakong / ABA / ACLEDA)
  - Coupon code for discount (% off, fixed amount, free shipping)
  - Order summary: subtotal, discount, delivery fee, total
- **QR Payment**: After placing order, shows vendor QR image with 15-minute countdown timer and "I've paid" confirmation
- **Order Tracking**: Status timeline (pending → confirmed → processing → delivered) + payment status in `/account`
- **Reviews**: Star rating + comment on products and shops; shop reviews shown in YouTube-style comment format
- **Support**: Submit support tickets to admin via `/support`
- **Account** (`/account`): Profile edit, order history, saved addresses, saved payment cards
- **Notifications**: Real-time in-app notifications via WebSocket

### Vendor

- **Dashboard** (`/vendor/dashboard`): Revenue summary, order count, top-selling products chart
- **Analytics** (`/vendor/analytics`): Revenue over time, order volume, best products by sales
- **Orders & Payouts** (`/vendor/payouts`):
  - Tabs: All / Pending / Confirmed / Cancelled / **Await** / **Receive**
  - Expand any order for full detail + delivery address map
  - **Await tab**: Payout bills pending admin bank transfer (shows order #, gross amount, fee %, net amount)
  - **Receive tab**: Completed payouts with full Bakong receipt (order total, fee, amount received, reference #, transfer date)
- **My Shop** (`/vendor/shop`): Edit shop name, description, contact, address, hours; upload logo & banner; open/close toggle
- **Products** (`/vendor/products`): Full CRUD — multiple images, product variants (attributes, SKU, price, stock), pricing, discount, category, status
- **Inventory** (`/vendor/inventory`): Lightweight catalog — one image, name, category, description per product
- **Coupons** (`/vendor/coupons`): Create discount codes (percentage, fixed, free shipping) with usage limits and expiry
- **Reviews** (`/vendor/reviews`):
  - **Shop Reviews tab**: View, reply to, and delete customer shop reviews
  - **Product Reviews tab**: View, reply to, and delete product reviews
  - Sub-filter: All / Newest / Replied
- **Notifications** (`/vendor/notifications`): Typed real-time notifications including payout completed, new order, product approved/rejected
- **Support** (`/vendor/support`): Submit tickets to admin
- **Settings** (`/vendor/settings`): Read-only profile info, Light/Dark/System theme, English/Khmer language, change password, link to payment QR setup
- **Payment QR** (`/vendor/payment`): Upload Bakong / ABA / ACLEDA QR images per currency; toggle active QR per type

### Admin

- **Dashboard** (`/admin/dashboard`): Platform-wide GMV, total revenue, user count, order volume
- **Analytics** (`/admin/analytics`): Revenue charts, order trends, platform metrics, badge summaries
- **Users** (`/admin/users`): View all users, suspend, ban, unban
- **Vendors** (`/admin/vendors`): List all vendors, view shop details, warn, approve, reject, suspend, ban
- **KYC Approval** (`/admin/vendor-kyc`): Review vendor KYC documents (ID card + selfie), approve or reject with reason
- **Products** (`/admin/products`): Approve / reject / warn / suspend / ban products submitted by vendors
- **Categories** (`/admin/categories`): Full CRUD — name, slug, icon, parent category (hierarchical tree)
- **Coupons** (`/admin/coupons`): Platform-wide coupon creation and management
- **Payouts** (`/admin/payouts`): View all vendor payout bills, complete individual or bulk-complete; triggers vendor notification
- **Commissions** (`/admin/commissions`): Track monthly platform fees per vendor, mark as paid, send commission invoices by email
- **Bank Account** (`/admin/bank-account`): Configure admin Bakong account used for vendor payout transfers; generate dynamic KHQR
- **Website Settings** (`/admin/settings`): Set site name, upload logo (light + dark), configure site-wide banner
- **Reports** (`/admin/reports`): View and manage user-submitted reports; update status, delete

---

## Payout Flow

```
Customer places order and confirms QR payment
           │
           ▼
PaymentObserver detects Payment status → "completed"
Auto-creates Payout record (status: pending)
           │
           ▼
Vendor sees bill in "Await" tab — shows gross amount, fee %, net amount
           │
           ▼
Admin reviews payout in /admin/payouts
Admin completes payout → transfers via Bakong
           │
           ▼
Payout status → "completed"
Vendor receives real-time notification: "Payout Transferred"
Vendor sees receipt in "Receive" tab with full Bakong transfer details
```

---

## Platform Fee Tiers

| Order Total  | Fee Rate |
|--------------|----------|
| ≤ $50        | 5%       |
| $51 – $150   | 8%       |
| $151 – $300  | 10%      |
| > $300       | 15%      |

Fee is deducted automatically from vendor payout. Customers see only the order total.

---

## Order Status Flow

```
pending → confirmed → processing → delivered
               ↘
           cancelled / refunded
```

- **pending**: Order placed, awaiting vendor payment confirmation
- **confirmed**: Vendor confirmed payment received
- **processing**: Vendor preparing shipment
- **delivered**: Order fulfilled
- **cancelled**: Cancelled by customer or vendor (before processing)

---

## Authentication Methods

| Method | Description |
|--------|-------------|
| Username/Email + Password | Standard login; vendors/customers use username |
| Google OAuth | One-click sign-in via Google account |
| Phone (Firebase) | OTP via Firebase phone auth (registration flow) |
| 2FA (TOTP) | Optional two-factor authentication for any account |

After social login, users are prompted to set a password and complete their profile onboarding.

---

## Multi-Language

The full app supports **English** and **Khmer (ខ្មែរ)**. Toggle via:
- The globe icon in the navbar
- Vendor/admin Settings page

Translation is handled by `useLangStore` (Zustand) + the `src/lib/i18n.ts` dictionary. All user-facing strings, status labels, form placeholders, and error messages have Khmer translations.

---

## Project Structure

```
Marketplacehub/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf                        ← reverse proxy for frontend + backend + storage
│
├── backend/                              ← Laravel 12 REST API
│   ├── routes/api.php                    ← all API routes (v1)
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── Auth/                     ← login, register, OAuth, phone, 2FA, email verify
│   │   │   ├── Admin/                    ← admin-only endpoints
│   │   │   ├── Vendor/                   ← vendor-only endpoints
│   │   │   └── Customer/                 ← customer-only endpoints
│   │   ├── Models/
│   │   │   ├── ProductImage.php          ← $appends=['url'] accessor (IMPORTANT)
│   │   │   ├── Payout.php                ← gross/vendor/fee/status
│   │   │   ├── ShopCommission.php        ← monthly fee tracking
│   │   │   └── ...
│   │   ├── Services/
│   │   │   └── KhqrService.php           ← Bakong KHQR generation
│   │   ├── Observers/
│   │   │   └── PaymentObserver.php       ← auto-creates Payout on payment completion
│   │   ├── Events/                       ← OrderPlaced, OrderStatusUpdated, NotificationCreated
│   │   ├── Jobs/
│   │   │   └── SendLowStockAlert.php
│   │   └── Console/Commands/
│   │       ├── AutoCalculateCommissions.php
│   │       ├── AutoScheduleShops.php
│   │       └── LiftExpiredProductSuspensions.php
│   └── database/migrations/             ← 30+ migrations
│
└── frontend/                             ← Next.js 15
    └── src/
        ├── app/
        │   ├── page.tsx                  ← homepage
        │   ├── about/                    ← about/our story
        │   ├── contact/
        │   ├── privacy-policy/
        │   ├── cookie-policy/
        │   ├── terms-of-service/
        │   ├── products/[slug]/
        │   ├── shops/[slug]/
        │   ├── categories/[slug]/
        │   ├── (auth)/                   ← login, register, forgot-password, reset-password,
        │   │                                set-password, verify-email, vendor-register,
        │   │                                register/phone, register/complete, auth/callback
        │   ├── (customer)/               ← account, checkout, orders, wishlist, notifications, support
        │   ├── (vendor)/vendor/          ← dashboard, analytics, orders, payouts, products,
        │   │                                inventory, coupons, reviews, shop, notifications,
        │   │                                payment, support, settings
        │   └── (admin)/admin/            ← dashboard, analytics, users, vendors, vendor-kyc,
        │                                    products, categories, coupons, payouts, commissions,
        │                                    bank-account, reports, settings
        ├── features/
        │   ├── products/
        │   │   ├── ProductDetailView.tsx ← images, variants, YouTube-style reviews
        │   │   └── ProductCard.tsx       ← reads image.url from API
        │   ├── shops/
        │   │   └── ShopDetailView.tsx    ← banner (Fav/Share top-right), logo overlap, reviews
        │   ├── vendor/
        │   │   ├── VendorPayouts.tsx     ← combined orders + payout tabs
        │   │   ├── VendorReviews.tsx     ← shop + product review tabs with reply/delete
        │   │   └── VendorPaymentQr.tsx   ← Bakong/ABA/ACLEDA QR upload
        │   ├── admin/
        │   │   ├── AdminPayouts.tsx      ← complete / bulk-complete payouts
        │   │   ├── AdminCommissions.tsx  ← monthly fee tracking + invoice email
        │   │   └── AdminVendorKyc.tsx    ← KYC document review
        │   └── checkout/
        │       └── PaymentQRModal.tsx    ← 15-min QR timer + "I've paid" confirm
        ├── store/
        │   ├── auth.store.ts             ← user, token, login/logout
        │   ├── cart.store.ts             ← items, add/remove/quantity
        │   ├── lang.store.ts             ← "en" | "km"
        │   └── notification.store.ts
        └── lib/
            ├── axios.ts                  ← HTTP client with Bearer token
            ├── i18n.ts                   ← English / Khmer translation dictionary
            ├── echo.ts                   ← Laravel Echo WebSocket config
            └── firebase.ts              ← Firebase phone auth config
```

---

## API Reference

### Public (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/v1/health` | Health check |
| GET  | `/api/v1/site-settings` | Platform name, logo, banner |
| POST | `/api/v1/auth/register` | Register (username, email, password) |
| POST | `/api/v1/auth/login` | Login → Bearer token |
| GET  | `/api/v1/auth/google` | Google OAuth redirect |
| POST | `/api/v1/auth/phone/firebase` | Firebase phone auth |
| POST | `/api/v1/auth/forgot-password` | Send reset email |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| GET  | `/api/v1/products` | List products (search, filter, paginate) |
| GET  | `/api/v1/products/:slug` | Product detail + images + reviews |
| GET  | `/api/v1/shops` | List shops |
| GET  | `/api/v1/shops/:slug` | Shop detail |
| GET  | `/api/v1/shops/:slug/reviews` | Shop reviews |
| GET  | `/api/v1/categories` | Category tree |
| GET  | `/api/v1/platform/bank-account` | Platform Bakong account (for checkout) |

### Customer (Bearer Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/v1/customer/cart/*` | Shopping cart |
| GET/POST/DELETE | `/api/v1/customer/wishlist/*` | Wishlist |
| POST | `/api/v1/customer/shops/:slug/favorite` | Toggle shop favorite |
| GET  | `/api/v1/customer/shop-favorites` | Favorited shops list |
| POST | `/api/v1/customer/checkout/place` | Place order |
| POST | `/api/v1/customer/checkout/coupon` | Apply coupon |
| GET  | `/api/v1/customer/orders` | Order history |
| POST | `/api/v1/customer/orders/:id/cancel` | Cancel order |
| POST | `/api/v1/customer/payments/:id/confirm` | Confirm QR payment made |
| GET  | `/api/v1/customer/payments/:id/status` | Poll payment status |
| CRUD | `/api/v1/customer/addresses/*` | Delivery addresses |
| POST | `/api/v1/customer/reviews` | Submit product review |
| POST | `/api/v1/customer/shops/:slug/reviews` | Submit shop review |
| CRUD | `/api/v1/customer/saved-cards/*` | Saved payment cards |

### Vendor (Bearer Token + `vendor` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/v1/vendor/dashboard` | Revenue & order summary |
| GET  | `/api/v1/vendor/analytics/*` | Revenue, orders, top products charts |
| CRUD | `/api/v1/vendor/products/*` | Product management |
| POST | `/api/v1/vendor/products/:id/images` | Upload product image |
| CRUD | `/api/v1/vendor/products/:id/variants/*` | Product variants |
| GET  | `/api/v1/vendor/orders` | Orders list |
| POST | `/api/v1/vendor/orders/:id/confirm` | Confirm order |
| POST | `/api/v1/vendor/orders/:id/deliver` | Mark as delivered |
| POST | `/api/v1/vendor/orders/:id/confirm-payment` | Confirm payment received |
| POST | `/api/v1/vendor/orders/:id/reject-payment` | Reject payment (cancel + notify) |
| GET  | `/api/v1/vendor/payouts` | Payout bills |
| CRUD | `/api/v1/vendor/payment-qr/*` | Payment QR images |
| GET  | `/api/v1/vendor/shop-reviews` | Shop reviews |
| POST | `/api/v1/vendor/shop-reviews/:id/reply` | Reply to shop review |
| GET  | `/api/v1/vendor/reviews` | Product reviews |
| POST | `/api/v1/vendor/reviews/:id/reply` | Reply to product review |
| GET/PUT | `/api/v1/vendor/shop` | Shop info |
| POST | `/api/v1/vendor/shop/logo` | Upload shop logo |
| POST | `/api/v1/vendor/shop/banner` | Upload shop banner |
| POST | `/api/v1/vendor/shop/toggle` | Open/close shop |

### Admin (Bearer Token + `admin` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/v1/admin/dashboard` | Platform-wide analytics |
| CRUD | `/api/v1/admin/users/*` | User management |
| POST | `/api/v1/admin/users/:id/suspend` | Suspend user |
| POST | `/api/v1/admin/users/:id/ban` | Ban user |
| CRUD | `/api/v1/admin/vendors/*` | Vendor management |
| GET  | `/api/v1/admin/vendor-kyc` | KYC submissions list |
| POST | `/api/v1/admin/vendor-kyc/:id/approve` | Approve KYC |
| POST | `/api/v1/admin/vendor-kyc/:id/reject` | Reject KYC |
| POST | `/api/v1/admin/products/:id/approve` | Approve product |
| POST | `/api/v1/admin/products/:id/reject` | Reject product |
| CRUD | `/api/v1/admin/categories/*` | Category management |
| CRUD | `/api/v1/admin/coupons/*` | Coupon management |
| GET  | `/api/v1/admin/payouts` | All vendor payout bills |
| POST | `/api/v1/admin/payouts/:id/complete` | Complete payout (notifies vendor) |
| POST | `/api/v1/admin/payouts/bulk-complete` | Bulk complete payouts |
| GET  | `/api/v1/admin/commissions` | Monthly commission records |
| POST | `/api/v1/admin/commissions/:id/send-invoice` | Email commission invoice |
| CRUD | `/api/v1/admin/bank-account/*` | Platform Bakong account |
| GET/POST | `/api/v1/admin/site-settings` | Website name, logos, banner |
| GET  | `/api/v1/admin/reports` | User-submitted reports |

---

## Known Gotchas

1. **Product images — `$appends = ['url']`**: `ProductImage` stores a `path` and computes `url` via a PHP accessor. The frontend must read `image.url`. **Never remove `$appends`** or images break everywhere across product cards, detail pages, and vendor inventory.

2. **Next.js `<Image>` in Docker**: The optimizer fetches images through `localhost:3000` inside the container, which cannot reach nginx `/storage/`. Use plain `<img>` tags (with `unoptimized` prop or raw `<img>`) for all product images, shop logos, banners, and QR codes.

3. **Frontend rebuild required**: `docker-compose restart frontend` does **not** apply Next.js code changes. You must always `docker-compose build frontend && docker-compose up -d --no-deps frontend`.

4. **Login uses username**: All roles (admin, vendor, customer) log in with their username. The backend `AuthController` checks the `username` field, not email.

5. **Order relationship**: The `Order` model uses `customer()` (not `user()`) to get the buyer. Using `order->user` will return `null`.

6. **PaymentObserver — no manual Payouts**: `PaymentObserver` automatically creates a `Payout` record when a `Payment` status transitions to `completed`. Never create payouts manually or duplicates will appear in the vendor's Await tab.

7. **Shop banner overlap**: The shop logo uses `-mt-10` to visually overlap the banner. Any element inside the `-mt-10` flex row may render inside the banner image area. Place action buttons as siblings **after** the overlap row, not inside it.

8. **Queue workers**: Low-stock alerts and notification jobs run via the `mh_queue` container. If notifications stop working, check `docker-compose restart queue`.

---

## Security

- Sanctum Bearer Token for all API auth
- Role-based middleware (`admin`, `vendor`, `customer`) on all protected routes
- Authorization policies on Orders, Products, and Shops (ownership checks)
- Input validation: Zod (frontend) + Laravel FormRequest (backend)
- File upload validation — MIME type check + size limits
- SQL injection prevention via Eloquent ORM (no raw queries)
- Passwords hashed with bcrypt
- CORS configured for frontend origin only
- Rate limiting on auth routes (login, register, OTP)
- Optional 2FA (TOTP via Google Authenticator)
- Security headers middleware on all responses
- Audit log middleware records sensitive admin actions

---

*Last updated: 2026-06-28*
