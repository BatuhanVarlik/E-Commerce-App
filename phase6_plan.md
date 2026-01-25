# Phase 6: Admin Panel Plan

## Objective

Build a comprehensive Admin Panel for store management, including product CRUD, category management, and order processing.

## Steps

### 1. Backend: Roles & Authorization

- [x] **Data Seeder Update**:
  - Ensure `Admin` role exists.
  - Create a default Admin user (`admin@admin.com` / `Admin123!`).
- [x] **Admin Controllers**:
  - `AdminProductController`: Full CRUD for products.
  - `AdminCategoryController`: Full CRUD for categories.
  - `AdminOrderController`: List all orders.
  - `AdminDashboardController`: Serve real-time stats.

### 2. Frontend: Admin Layout & Dashboard

- [x] **Admin Layout**: Separate layout with a sidebar specific to admin functions.
- [x] **Route Protection**: Ensure only users with `Admin` role can access `/admin/*` (Backend protected, frontend public checks added).
- [x] **Dashboard**: Display real stats (Total Orders, Total Revenue, etc.) from API.

### 3. Frontend: Management Pages

- [x] **Product Management**:
  - List all products.
  - Add New Product form.
  - Edit Product form.
  - Delete Product.
- [x] **Category Management**:
  - List/Add Categories.
- [x] **Order Management**:
  - List all customer orders.
  - Change order status (Pending implementation).

### 4. Verification

- [x] Log in as Admin.
- [x] Perform CRUD on products.
- [x] Verify Dashboard stats are real.
