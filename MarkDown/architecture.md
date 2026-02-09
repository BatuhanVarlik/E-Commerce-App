# Architecture & File Structure

## Tech Stack

- **Backend**: .NET 8 (C#)
- **Frontend**: Next.js (React/TypeScript)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Payment**: Iyzico
- **Auth**: ASP.NET Core Identity + Google OAuth 2.0

## Backend Architecture (Clean Architecture)

Proje Clean Architecture prensiplerine göre yapılandırılmıştır.

```
/Backend
  ├── ETicaret.API/              # Controllers, Middlewares, Program.cs
  │   ├── Controllers/           # API Endpoints
  │   └── wwwroot/               # Static files, uploads
  │
  ├── ETicaret.Application/      # DTOs, Services, Validators, Interfaces
  │   ├── DTOs/                  # Data Transfer Objects
  │   ├── Interfaces/            # Service interfaces
  │   └── Validators/            # FluentValidation validators
  │
  ├── ETicaret.Domain/           # Entities, Enums (Core Business Logic)
  │   ├── Entities/              # Product, Order, User, etc.
  │   └── Enums/                 # OrderStatus, PaymentStatus, etc.
  │
  ├── ETicaret.Infrastructure/   # EF Core, External Services
  │   ├── Data/                  # DbContext, Migrations
  │   ├── Services/              # AuthService, EmailService, etc.
  │   ├── Middleware/            # GlobalExceptionMiddleware
  │   └── Attributes/            # Cache attributes
  │
  ├── Dockerfile                 # Production Docker config
  └── ETicaret.sln               # Solution file
```

## Frontend Architecture (Next.js App Router)

Modern App Router yapısı kullanılmaktadır.

```
/Frontend
  ├── app/                       # App Router (Pages & Layouts)
  │   ├── (auth)/                # Route Group for Auth (login, register)
  │   ├── admin/                 # Admin Dashboard pages
  │   ├── profile/               # User profile pages
  │   ├── products/              # Product listing & detail
  │   └── layout.tsx             # Root layout
  │
  ├── components/
  │   ├── ui/                    # Reusable UI (Button, Input, Skeleton)
  │   ├── admin/                 # Admin panel components
  │   └── mobile/                # Mobile-specific components
  │
  ├── lib/                       # Utilities, API clients
  │   ├── api.ts                 # Axios instance & API helpers
  │   ├── cookieStorage.ts       # Auth cookie management
  │   └── seo.ts                 # SEO utilities
  │
  ├── hooks/                     # Custom React Hooks
  ├── context/                   # AuthContext, CartContext
  ├── public/                    # Static Assets
  │
  ├── Dockerfile                 # Production Docker config
  └── next.config.ts             # Next.js configuration
```

## Database Schema (Ana Tablolar)

```
Users           ─┬─ Orders ──── OrderItems
                 ├─ Reviews
                 ├─ Addresses
                 ├─ Wishlists
                 └─ ChatRooms

Products        ─┬─ ProductVariants
                 ├─ Reviews
                 └─ Categories, Brands

Coupons, Shipments, AuditLogs, ViewHistory, Referrals, UserPoints
```

## Tamamlanan Fazlar

- ✅ Phase 1-5: Temel altyapı, Auth, Ürün yönetimi
- ✅ Phase 6-10: Sepet, Ödeme, Kupon sistemi
- ✅ Phase 11-15: Profil, Karşılaştırma, Kargo, Email
- ✅ Phase 16-20: Varyantlar, Öneriler, Hızlı satın alma, Admin Dashboard
- ✅ Phase 21-24: Güvenlik, Mobil, Sosyal, Canlı destek

Detaylı roadmap için: [MODERNIZATION_ROADMAP.md](./MODERNIZATION_ROADMAP.md)
