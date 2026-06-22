# MarketplaceHub — System Architecture

## Overview

Multi-Vendor E-Commerce Marketplace with 3 roles: Admin, Shop Owner (Vendor), Customer.

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                           │
│   Next.js 16 (App Router) · TypeScript · Tailwind · Shadcn    │
│   Zustand · TanStack Query · Axios · React Hook Form · Zod     │
└────────────────────┬───────────────────────────────────────────┘
                     │ HTTPS / REST API
┌────────────────────▼───────────────────────────────────────────┐
│                        API GATEWAY                             │
│              Nginx Reverse Proxy (port 80/443)                 │
└────────┬───────────────────────────────────────┬───────────────┘
         │                                       │
┌────────▼────────┐                   ┌──────────▼──────────────┐
│  Laravel 12 API │                   │   WebSocket Server       │
│  PHP 8.4+       │                   │   Laravel Broadcasting   │
│  Sanctum Auth   │                   │   Pusher / Laravel Echo  │
│  Service Layer  │                   └──────────┬──────────────┘
│  Queue Workers  │                              │
└────────┬────────┘                              │
         │                                       │
┌────────▼────────────────────────────▼──────────┐
│                  DATA LAYER                     │
│  PostgreSQL (primary)   Redis (cache/sessions)  │
│  S3-Compatible Storage (media/uploads)          │
└─────────────────────────────────────────────────┘
```

## Request Flow

1. Browser → Nginx
2. Nginx → Next.js (frontend) or Laravel API (backend `/api/*`)
3. Laravel → Service Layer → Repository → PostgreSQL
4. Cached responses served from Redis
5. Events broadcast via WebSocket to subscribed clients

## Auth Flow

```
User → POST /api/auth/login
     ← Sanctum Token (Bearer)
     → All subsequent requests: Authorization: Bearer {token}
     ← Protected resources
```

## Key Design Patterns

| Layer        | Pattern                        |
|--------------|--------------------------------|
| Controllers  | Thin — delegate to Services    |
| Services     | Business logic, orchestration  |
| Repositories | Data access abstraction        |
| Policies     | Authorization rules            |
| Events       | Decouple side-effects          |
| Jobs         | Async background processing    |
| Resources    | API response transformation    |
