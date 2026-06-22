# CamCart — MarketplaceHub

> Multi-Vendor E-Commerce Marketplace for Cambodia — Production-Ready Architecture

---

## Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| State      | Zustand, TanStack Query (React Query) |
| Forms      | React Hook Form + Zod validation |
| Backend    | Laravel 12, PHP 8.4+ |
| Auth       | Laravel Sanctum (Bearer Token) |
| Database   | PostgreSQL 16 |
| Cache      | Redis 7 |
| Storage    | Local (nginx serves `/storage/`) |
| Queue      | Redis + Laravel Queue Workers |
| Deploy     | Docker + Docker Compose + Nginx |

---

## User Roles

| Role     | Capabilities |
|----------|-------------|
| Admin    | Manage users, approve/reject shops & products, view analytics, manage categories & coupons |
| Vendor   | Create shop, manage products & inventory, upload QR payment codes, process orders, confirm/reject payments, view analytics |
| Customer | Browse & search products, cart, wishlist, shop favorites, checkout (COD/QR/Card), order tracking, reviews |

---

## Quick Start

### Prerequisites
- Docker 24+
- Docker Compose v2

### 1. Start with Docker Compose

```bash
cd ~/Desktop/Marketplacehub
docker-compose up -d
```

### 2. Run migrations & seed

```bash
docker exec mh_backend php artisan migrate --seed
```

### 3. Access the app

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost |
| API       | http://localhost/api/v1 |

### Demo Accounts

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Admin    | admin@marketplacehub.com | Admin@2024 |
| Vendor   | vendor@demo.com          | Demo@2024  |
| Customer | customer@demo.com        | Demo@2024  |

---

## IMPORTANT: Deployment Rules

**Frontend changes** require a full rebuild — `docker-compose restart` does NOT apply new code:

```bash
docker-compose build frontend
docker-compose up -d frontend
```

**Backend (PHP) changes** take effect immediately via docker cp:

```bash
docker cp backend/path/to/File.php mh_backend:/var/www/html/path/to/File.php
```

**Never use `docker-compose restart` for frontend** — it keeps the old container and old build.

---

## Features Built

### Customer Features
- **Browse & Search**: Product listing with category filter, price filter, search, sort
- **Product Detail**: Image gallery, variants, star ratings, review count, share button
- **Product Reviews**: Star rating (1–5) + comment, one review per user per product
- **Cart**: Add/remove/update items, multi-vendor cart grouping
- **Wishlist**: Save products (heart icon on product cards), view at `/wishlist`
- **Shop Favorites**: Heart button on shop detail page, shop favorites tab in `/wishlist`
- **Navbar Heart Icon**: Quick access to wishlist (customers only)
- **Checkout**:
  - Delivery address: select saved address or link to add new one at `/account`
  - Payment: COD / QR Bank Transfer / Credit Card
  - QR auto-selects first code when QR method chosen
  - Order summary: subtotal + shipping ($2/shop) + tax (0.5%) + discount
  - Coupon code support
- **QR Payment Modal**: Shows vendor's real QR image after order placed, 15-min timer, "I've paid" button, polls for payment confirmation
- **Order Tracking**: Customer can view order status + payment status
- **Customer Dashboard** (`/account`):
  - Profile tab
  - Orders tab
  - Addresses tab (used for delivery)
  - Payment Methods / Saved Cards tab
  - Back to Home button

### Vendor Features
- **Shop Management**: Create/edit shop, upload logo + banner, open/close shop
- **Product Management**: CRUD products with images, variants (size/color), stock
- **QR Payment Setup**: Upload QR codes per bank (ABA, Bakong, ACLEDA), per currency (USD/KHR)
- **Order Management**:
  - "New Order" tab (was "pending") — orders appear here after customer pays
  - Payment column shows method (COD/ABA/Bakong) + status (Awaiting/Paid/Refunded)
  - **Confirm Payment** (green ✓ button): vendor marks QR payment received → order moves to processing
  - **Reject Payment** (red ✗ button): vendor rejects QR payment → payment marked Refunded, order cancelled, stock restored
  - Confirm → Ship → Deliver order status flow
- **Shop Reviews**: Vendors can reply to customer reviews
- **Analytics Dashboard**: Revenue, orders, top products

### Admin Features
- **Shop Approval**: Approve / reject / suspend shops
- **Product Moderation**: Approve / reject products
- **User Management**: View/suspend users
- **Category Management**: CRUD categories with icons
- **Coupon Management**: Create discount codes
- **Platform Analytics**: Revenue, GMV, user stats

---

## Payment Flow

```
Customer places order
        │
        ▼
Payment status = "pending"
        │
    COD? ──────────────────────────────────────────────────────────────►
        │                                              Vendor clicks ✓ Confirm Payment
    QR/Bank?                                           Order → "confirmed" → Ship → Deliver
        │
        ▼
Customer sees QR modal (real vendor QR image)
Customer scans + pays in their banking app
Customer clicks "I've paid ✓"
        │
        ▼
Payment status = "completed" (customer-confirmed)
Vendor sees "Paid" badge in orders
Vendor clicks ✓ to confirm they received it
        │
        ├── Vendor confirms → Order → "confirmed" → Ship → Deliver
        │
        └── Vendor rejects → Payment = "Refunded", Order = "Cancelled", Stock restored
```

---

## Project Structure

```
Marketplacehub/
├── README.md
├── ARCHITECTURE.md
├── ERD.md
├── docker-compose.yml
├── nginx/
│
├── backend/                         ← Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── Admin/               ← Admin controllers
│   │   │   ├── Vendor/
│   │   │   │   ├── VendorOrderController.php   ← confirm/reject payment
│   │   │   │   ├── VendorPaymentQrController.php
│   │   │   │   └── ...
│   │   │   └── Customer/
│   │   │       ├── CheckoutController.php      ← place order
│   │   │       ├── PaymentController.php       ← status + confirm
│   │   │       ├── ShopReviewController.php    ← shop reviews
│   │   │       ├── ShopFavoriteController.php  ← shop favorites
│   │   │       ├── ReviewController.php        ← product reviews
│   │   │       ├── WishlistController.php      ← product wishlist
│   │   │       └── ...
│   │   ├── Models/
│   │   │   ├── Order.php            ← customer() relationship
│   │   │   ├── Payment.php          ← status: pending/completed/refunded/failed
│   │   │   ├── ShopReview.php       ← shop ratings
│   │   │   └── ...
│   │   └── Services/
│   │       ├── Order/OrderService.php  ← calculateSummary (snake_case keys), placeOrder
│   │       └── Cart/CartService.php   ← loads items.product.shop:id,name,slug
│   └── routes/api.php
│
└── frontend/src/
    ├── app/
    │   ├── (customer)/
    │   │   ├── checkout/page.tsx
    │   │   ├── wishlist/page.tsx     ← Products + Shops tabs
    │   │   └── account/page.tsx
    │   └── ...
    ├── features/
    │   ├── checkout/
    │   │   ├── CheckoutView.tsx      ← uses plain <img> for QR (not Next.js Image)
    │   │   └── PaymentQRModal.tsx    ← uses plain <img> for QR
    │   ├── vendor/
    │   │   ├── VendorOrders.tsx      ← payment column, confirm/reject, "New Order" label
    │   │   └── ...
    │   ├── shops/
    │   │   ├── ShopDetailView.tsx    ← shop reviews, heart favorite button
    │   │   └── ...
    │   └── customer/
    │       ├── CustomerAccount.tsx   ← tabs, Back to Home button
    │       └── WishlistView.tsx      ← Products + Shops tabs
    └── components/layout/Navbar.tsx  ← heart icon linking to /wishlist
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login → Bearer token |
| POST | `/api/v1/auth/logout` | Logout |
| GET  | `/api/v1/auth/me` | Current user |

### Public Catalog
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products (search, filter, sort, paginate) |
| GET | `/api/v1/products/:slug` | Product detail |
| GET | `/api/v1/shops` | List shops |
| GET | `/api/v1/shops/:slug` | Shop + products |
| GET | `/api/v1/shops/:slug/reviews` | Shop reviews (public) |
| GET | `/api/v1/shops/:slug/payment-qr` | Shop QR codes (for checkout) |
| GET | `/api/v1/categories` | Category tree |
| GET | `/api/v1/reviews` | Product reviews (public, ?product_id=X) |

### Customer (Bearer token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/v1/customer/cart/...` | Cart management |
| GET/POST/DELETE | `/api/v1/customer/wishlist/...` | Product wishlist |
| GET/POST | `/api/v1/customer/shop-favorites` | Shop favorites |
| POST | `/api/v1/customer/shops/:slug/favorite` | Toggle shop favorite |
| POST | `/api/v1/customer/shops/:slug/reviews` | Add shop review |
| POST | `/api/v1/customer/reviews` | Add product review |
| GET | `/api/v1/customer/checkout/summary` | Order totals (subtotal/shipping_fee/tax_amount/total) |
| POST | `/api/v1/customer/checkout/place` | Place order |
| GET | `/api/v1/customer/orders` | Order history |
| GET | `/api/v1/customer/payments/:orderId/status` | Poll payment status |
| POST | `/api/v1/customer/payments/:orderId/confirm` | Confirm QR payment made |
| GET/POST/DELETE | `/api/v1/customer/addresses/...` | Delivery addresses |

### Vendor (Bearer token + vendor role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/dashboard` | Analytics summary |
| CRUD | `/api/v1/vendor/products` | Product management |
| GET | `/api/v1/vendor/orders` | Orders list (includes payment) |
| POST | `/api/v1/vendor/orders/:id/confirm` | Confirm order (after payment) |
| POST | `/api/v1/vendor/orders/:id/ship` | Mark shipped |
| POST | `/api/v1/vendor/orders/:id/deliver` | Mark delivered |
| POST | `/api/v1/vendor/orders/:id/confirm-payment` | Vendor confirms received payment |
| POST | `/api/v1/vendor/orders/:id/reject-payment` | Reject payment → cancel + refund |
| CRUD | `/api/v1/vendor/payment-qr` | Manage QR payment images |

### Admin (Bearer token + admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Platform analytics |
| POST | `/api/v1/admin/shops/:id/approve|reject|suspend` | Shop moderation |
| POST | `/api/v1/admin/products/:id/approve|reject` | Product moderation |
| CRUD | `/api/v1/admin/users` | User management |
| CRUD | `/api/v1/admin/categories` | Category management |

---

## Known Gotchas

1. **Next.js `<Image>` inside Docker container**: The optimizer tries to fetch images through `localhost:3000` inside the container, which can't reach nginx storage. Always use plain `<img>` tags with `onError` fallback for product images, shop logos/banners, and QR codes.

2. **`$request->validated()`**: Doesn't exist on the base Laravel `Request` class — only on `FormRequest`. Always use the return value: `$validated = $request->validate([...])`.

3. **Summary API key names**: `OrderService::calculateSummary` returns `shipping_fee` and `tax_amount` (snake_case). Frontend must use these exact keys.

4. **Cart eager load for checkout**: `CartService::getCart` must load `items.product.shop:id,name,slug` so the checkout page can fetch shop QR codes immediately without a second cart query.

5. **`z.coerce.number()`**: HTML radio inputs always submit strings. Use `z.coerce.number()` in Zod schemas for `address_id` and any numeric radio input.

6. **Order relationship**: `Order` model uses `customer()` (not `user()`) as the relationship name for the buyer. Frontend must access `order.customer.name`, not `order.user.name`.

---

## Tax & Shipping

- **Shipping**: $2.00 flat fee per shop (multi-vendor orders each get $2)
- **Tax**: 0.5% of subtotal (`taxRate = 0.005`)
- Both displayed in checkout order summary

---

## Security

- Laravel Sanctum Bearer Token auth
- Role-Based Access Control (RoleMiddleware + Policies)
- Input validation via Zod (frontend) + Laravel validation (backend)
- SQL injection prevention via Eloquent ORM
- File upload validation (type, size limits)
- Rate limiting on auth routes
- CORS configured for frontend origin
- Passwords hashed with bcrypt

---

## Deployment Commands

```bash
# Full rebuild (first time or after major changes)
docker-compose up -d --build

# Frontend code change
docker-compose build frontend && docker-compose up -d frontend

# Backend PHP change (instant, no rebuild)
docker cp backend/app/path/File.php mh_backend:/var/www/html/app/path/File.php

# Run migrations
docker exec mh_backend php artisan migrate

# View backend logs
docker exec mh_backend tail -100 /var/www/html/storage/logs/laravel.log

# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

*Last updated: 2026-06-23*
