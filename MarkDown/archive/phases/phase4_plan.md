# Phase 4: Payment & Checkout (Iyzico Integration)

## Goals

- Integrate **Iyzico** Payment Gateway (Sandbox Mode).
- Implement Checkout process where users enter shipping details and card info.
- Create `Order` entities to store successful purchases.
- Clear user cart after successful payment.

## 1. Backend (Payment & Orders)

- [ ] **Dependencies**: Install `Iyzipay` NuGet package.
- [ ] **Entities**: Create `Order`, `OrderItem`, `Address` entities.
- [ ] **Database**: Create migrations for Orders.
- [ ] **Services**:
  - `IPaymentService`: Wrap Iyzico logic.
  - `IOrderService`: Handle order creation.
- [ ] **API**:
  - `CheckoutController` or `PaymentController`.
  - `OrdersController` (for user order history).

## 2. Frontend (Checkout UI)

- [ ] **Pages**:
  - `/checkout`: Multi-step form (Address -> Payment).
  - `/checkout/success`: Success page after payment.
- [ ] **Components**:
  - `AddressForm`: For shipping details.
  - `CreditCardForm`: For styling (actual data sent securely).

## 3. Order History

- [ ] Update Profile page to show actual orders fetched from API.
