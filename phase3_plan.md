# Phase 3: Shopping Cart & Checkout Plan

## Goals

- Implement a high-performance Shopping Cart using **Redis**.
- Allow users to add/remove items and view their cart.
- Implement Checkout process (initial setup).
- Integrate **Iyzico** for payment processing (simulated for now, SDK later).

## 1. Backend (Redis Cart)

- [ ] **Infrastructure**: Configure `StackExchange.Redis` in `Program.cs` / `DependencyInjection.cs`.
- [ ] **Models**: Create `Cart` and `CartItem` models (not EF entities, just objects for Redis).
- [ ] **Service**: Implement `ICartService` to handling `GetCart`, `UpdateCart`, `DeleteCart`.
- [ ] **API**: Create `CartController`.

## 2. Frontend (Cart UI)

- [ ] **Context**: Create `CartContext` to manage cart state globally (sync with Backend).
- [ ] **Components**:
  - `AddToCartButton`: On Product Detail Page.
  - `CartDrawer` or `CartPage`: To view items.
- [ ] **Pages**:
  - `/cart`: Detailed view of cart items with totals.
  - `/checkout`: Checkout form (Phase 3.5).

## 3. Payment (Iyzico) - _To be started after Cart_

- [ ] Install Iyzico .NET SDK.
- [ ] Create Payment Service.
