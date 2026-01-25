# Phase 1: Foundation & Authentication Plan

## Goals

- Initialize the technical stack.
- Establish database connectivity.
- Implement secure authentication (Email/Password + Social Login).
- Create the basic application shell.

## 1. Backend Setup (.NET 8)

- [ ] Create Solution `ETicaret.sln`
- [ ] Create Projects:
  - `ETicaret.Domain` (Class Library)
  - `ETicaret.Application` (Class Library)
  - `ETicaret.Infrastructure` (Class Library)
  - `ETicaret.API` (Web API)
- [ ] Setup EF Core with PostgreSQL.
- [ ] Setup Redis connection.
- [ ] Configure Swagger/OpenAPI.

## 2. Database & Identity

- [ ] Define `User` and `Role` entities (`IdentityUser`).
- [ ] Configure `IdentityDbContext`.
- [ ] Run initial migration.
- [ ] Implement JWT Token generation.
- [ ] **Social Auth**:
  - Implement "Sign in with Google".
  - Implement "Sign in with Apple" (referred to as App Store/Play Store in prompt).

## 3. Frontend Setup (Next.js)

- [ ] Initialize Next.js 14+ (App Router).
- [ ] Setup Tailwind CSS (if requested/default) or CSS Modules as per prompt preference.
  - _Note_: Prompt mentioned "Vanilla CSS" or "Tailwind if requested". Since user said "Mainly Vanilla CSS for flexibility", we will respect that but maybe use modules for scoping. Or standard CSS.
- [ ] Setup Authentication Context/Provider.
- [ ] Create Login/Register Pages.
- [ ] Connect with Backend API.

## 4. Deliverables for Phase 1

- Running Backend API with Swagger.
- Running Frontend communicating with API.
- Working Login/Register flow.
