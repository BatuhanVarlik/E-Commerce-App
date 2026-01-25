# Phase 5: Order History Plan

## Objective

Enable users to view their past orders and order details.

## Steps

### 1. Backend Development

- [x] **Create DTOs**:
  - `OrderDto`: Order summary (Date, Total Amount, Status, Order No).
  - `OrderDetailDto`: Order details and items.
  - `OrderItemDto`: Items within the order.
- [x] **Interface and Service**:
  - `IOrderService`: Define `GetOrdersByUserIdAsync(string userId)` and `GetOrderByIdAsync(Guid orderId)`.
  - `OrderService`: Implement these methods.
- [x] **Controller**:
  - `OrdersController`: Create `/api/orders` endpoints.
    - `GET /api/orders`: List orders for the logged-in user.
    - `GET /api/orders/{id}`: Specific order details.

### 2. Frontend Development

- [x] **API Service**:
  - Implement functions to fetch orders using `axios`.
- [x] **Order List Page (`/profile/orders/page.tsx`)**:
  - List orders as cards.
  - Display date, status, amount, and a "View Details" button on each card.
  - Ensure design matches the new color palette (`custom-red`, `custom-orange`).
- [ ] **Order Detail Modal or Page**: (Optional/Future)
  - Show full order content (products, quantities, prices).

### 3. Testing and Verification

- [x] Create an order with a test user.
- [x] Verify the created order appears on the "My Orders" page.
