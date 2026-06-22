# MarketplaceHub

> Multi-Vendor E-Commerce Marketplace — Production-Ready Architecture

## Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| State      | Zustand, TanStack Query |
| Forms      | React Hook Form + Zod |
| Backend    | Laravel 12, PHP 8.4+ |
| Auth       | Laravel Sanctum (Bearer Token) |
| Database   | PostgreSQL 16 |
| Cache      | Redis 7 |
| Storage    | Local / S3-ready |
| Realtime   | Laravel Broadcasting + Pusher |
| Queue      | Redis + Laravel Queue Workers |
| Deploy     | Docker + Docker Compose + Nginx |

## User Roles

| Role     | Capabilities |
|----------|-------------|
| Admin    | Manage users, approve/reject shops & products, view analytics, manage categories & coupons |
| Vendor   | Create shop, manage products & inventory, process orders, view revenue analytics, manage coupons |
| Customer | Browse & search products, cart, wishlist, checkout, order tracking, reviews |

## Quick Start

### Prerequisites
- Docker 24+
- Docker Compose v2

### 1. Clone & configure

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

### 3. Run migrations & seed

```bash
docker exec mh_backend php artisan migrate --seed
```

### 4. Access the app

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost |
| API       | http://localhost/api/v1 |
| pgAdmin   | http://localhost:5050 (with `--profile dev`) |

## Demo Accounts

| Role     | Email                         | Password    |
|----------|-------------------------------|-------------|
| Admin    | admin@marketplacehub.com      | Admin@2024  |
| Vendor   | vendor@demo.com               | Demo@2024   |
| Customer | customer@demo.com             | Demo@2024   |

## Development (local, no Docker)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve          # http://localhost:8000
php artisan queue:work     # in separate terminal
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev                # http://localhost:3000
```

## Project Structure

```
food_app_web/
├── ARCHITECTURE.md      ← System architecture overview
├── ERD.md               ← Entity Relationship Diagram (Mermaid)
├── docker-compose.yml   ← Full stack Docker setup
├── nginx/               ← Nginx reverse proxy config
│
├── backend/             ← Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Auth/         ← Register, Login, Verify
│   │   │   ├── Controllers/Api/V1/
│   │   │   │   ├── Admin/               ← Admin controllers
│   │   │   │   ├── Vendor/              ← Vendor controllers
│   │   │   │   └── Customer/            ← Customer controllers
│   │   │   ├── Middleware/EnsureRole     ← RBAC middleware
│   │   │   └── Requests/                ← Form validation
│   │   ├── Models/                      ← Eloquent models (20+)
│   │   ├── Services/                    ← Business logic layer
│   │   │   ├── Auth/AuthService
│   │   │   ├── Cart/CartService
│   │   │   ├── Order/OrderService
│   │   │   ├── Coupon/CouponService
│   │   │   ├── Analytics/AnalyticsService
│   │   │   └── Notification/NotificationService
│   │   ├── Events/                      ← WebSocket events
│   │   ├── Jobs/                        ← Queue jobs
│   │   ├── Notifications/               ← Email notifications
│   │   └── Policies/                    ← Authorization policies
│   ├── database/
│   │   ├── migrations/                  ← 15 migration files
│   │   └── seeders/                     ← Demo data seeder
│   └── routes/api.php                   ← All API routes
│
└── frontend/            ← Next.js 15 App Router
    └── src/
        ├── app/
        │   ├── (auth)/login, register
        │   ├── (customer)/cart, checkout, orders, profile
        │   ├── (vendor)/dashboard, products, orders, analytics
        │   ├── (admin)/dashboard, vendors, products, users
        │   ├── products/[slug]
        │   ├── shops/[slug]
        │   └── categories/[slug]
        ├── components/
        │   ├── layout/Navbar, Footer
        │   └── layout/dashboards/VendorLayout, AdminLayout
        ├── features/
        │   ├── auth/LoginForm, RegisterForm
        │   ├── products/ProductCard, ProductListingPage, ProductDetailView
        │   ├── cart/CartSidebar
        │   ├── checkout/CheckoutView
        │   ├── orders/OrderDetailView
        │   ├── vendor/VendorDashboard
        │   ├── admin/AdminDashboard, AdminVendors
        │   ├── shops/FeaturedShops
        │   └── categories/CategoryGrid
        ├── hooks/useAuth, useCart, useProducts
        ├── lib/axios, utils, echo (WebSocket)
        ├── services/auth, product, cart, order
        ├── store/auth.store, cart.store, notification.store
        └── types/index.ts                ← All TypeScript types
```

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
| GET | `/api/v1/categories` | Category tree |

### Customer (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/v1/customer/cart/...` | Cart management |
| GET/POST | `/api/v1/customer/wishlist/...` | Wishlist |
| POST | `/api/v1/customer/checkout/place` | Place order |
| GET | `/api/v1/customer/orders` | Order history |

### Vendor (requires auth + vendor role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/dashboard` | Analytics summary |
| CRUD | `/api/v1/vendor/products` | Product management |
| CRUD | `/api/v1/vendor/orders` | Order processing |
| POST | `/api/v1/vendor/orders/:id/confirm|ship|deliver` | Status updates |

### Admin (requires auth + admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Platform analytics |
| POST | `/api/v1/admin/shops/:id/approve|reject|suspend` | Shop moderation |
| POST | `/api/v1/admin/products/:id/approve|reject` | Product moderation |
| CRUD | `/api/v1/admin/users` | User management |
| CRUD | `/api/v1/admin/categories` | Category management |

## Security

- Laravel Sanctum Bearer Token auth
- Role-Based Access Control (EnsureRole middleware + Policies)
- Input validation via Form Requests + Zod (frontend)
- SQL injection prevention via Eloquent ORM
- File upload validation (type, size limits)
- Rate limiting on auth routes
- CORS configured for frontend origin
- Passwords hashed with bcrypt

## Testing Strategy

```bash
# Backend
cd backend
php artisan test                  # PHPUnit
./vendor/bin/pest                 # Pest

# Frontend
cd frontend
npm run type-check                # TypeScript
npm run lint                      # ESLint
```

## Deployment

```bash
# Production
docker compose -f docker-compose.yml up -d --build

# Run migrations
docker exec mh_backend php artisan migrate --force
docker exec mh_backend php artisan db:seed --force
docker exec mh_backend php artisan storage:link
docker exec mh_backend php artisan config:cache
docker exec mh_backend php artisan route:cache
docker exec mh_backend php artisan view:cache
```
