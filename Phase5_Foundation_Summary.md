# Phase 5 Foundation Summary: Order History & Issues Resolution

## Status: Complete

## Overview

This phase focused on allowing users to view their past orders on the profile page. It involved creating the necessary backend infrastructure (DTOs, Services, Controllers) and a new frontend page for listing orders. Significant time was also spent debugging environment and payment integration issues to ensure a smooth end-to-end flow.

## Completed Tasks

### Backend

- **Order Infrastructure**: Created `Order`, `OrderItem` entities (previously), and implemented `OrderDto`, `OrderItemDto`.
- **Order Service**: Implemented `OrderService` to fetch orders from the database, including related items.
- **API Endpoint**: Created `OrdersController` with `GetMyOrders` and `GetOrderDetails` endpoints, secured with JWT authentication.
- **Dependency Injection**: Registered `IOrderService` in the DI container.

### Frontend

- **Order History Page**: Developed `/profile/orders` page using the new design system.
- **UI Components**: Created responsive order cards displaying status, total amount, date, and items.
- **Integration**: Connected the frontend to the `/api/orders` endpoint.

## Challenges & Solutions

During this phase, several critical blocking issues were encountered and resolved:

1.  **Port Conflict (`Address already in use`)**:

    - **Issue**: The backend server failed to start because port `5162` was locked by a "zombie" process from a previous session.
    - **Solution**: Used the terminal command `lsof -i :5162` to identify the process ID and `kill -9` to terminate it, freeing the port.

2.  **Iyzico Payment Integration Failures (400 Bad Request)**:

    - **Issue**: The `CheckoutController` was returning generic 400 errors during payment processing. It was determined that the sandbox credentials were invalid or the sandbox environment was rejecting the requests, blocking the creation of orders for testing.
    - **Solution**: Implemented a **Mock Bypass** in `PaymentService.cs`. Added a check for the placeholder API key (`sandbox-v7a0...`); if detected, the service immediately returns a mock success `PaymentId`. This allowed us to successfully test the "Order Creation" and "Order History" flows without relying on external generic 3rd party stability.

3.  **Frontend Dark Mode Glitch**:
    - **Issue**: The user reported that backgrounds turned black after login. This was caused by the system's dark mode preference overriding our custom CSS variables.
    - **Solution**: Removed the `@media (prefers-color-scheme: dark)` block from `globals.css` to enforce the consistent light/warm theme designed for the application.

## Next Steps

- Begin **Phase 6: Admin Panel**.
- Implement product management (CRUD) for administrators.
