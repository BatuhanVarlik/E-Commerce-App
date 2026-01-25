# Architecture & File Structure

## Tech Stack

- **Backend**: .NET 8 (C#)
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Payment**: Iyzico / Stripe
- **Auth**: ASP.NET Core Identity + External (Google/Apple)

## Backend Architecture (Clean Architecture)

We will follow the Clean Architecture principles to ensure scalability and maintainability.

```
/Backend
  /src
    /Core
      /Domain          # Entities, Enums, Interfaces (Core Business Logic)
      /Application     # DTOs, Services, Validators (Use Cases, CQRS)
    /Infrastructure
      /Persistence     # EF Core Context, Migrations, Repositories
      /Infrastructure  # External Services (Email, Payment, Redis)
    /Presentation
      /API             # Controllers, Middlewares
  /tests               # Unit & Integration Tests
```

## Frontend Architecture (Next.js App Router)

We will use the modern App Router structure.

```
/Frontend
  /app                 # App Router (Pages & Layouts)
    /(auth)            # Route Group for Auth
    /(shop)            # Route Group for Main Shop
    /admin             # Admin Dashboard
  /components
    /ui                # Reusable UI components (Buttons, Inputs)
    /features          # Feature-specific components (ProductCard, Cart)
  /lib                 # Utilities, API clients, Constants
  /hooks               # Custom React Hooks
  /store               # State Management (Zustand/Context)
  /public              # Static Assets
```
