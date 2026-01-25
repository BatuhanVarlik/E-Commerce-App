# Phase 2: Product Catalog & Discovery Plan

## Goals

- Design and implement the database schema for products, categories, and brands.
- Develop Backend APIs for CRUD operations on the catalog.
- Create Frontend pages for listing (PLP) and viewing product details (PDP).
- Implement basic search and filtering.

## 1. Database & Domain (Backend)

- [ ] **Entities**:
  - `Category`: Id, Name, Slug, ParentId.
  - `Brand`: Id, Name, Logo.
  - `Product`: Id, Name, Slug, Description, Price, Stock, CategoryId, BrandId, Images (JSON/Table).
- [ ] **Data Seeding**: Create initial dummy data for testing.
- [ ] **Persistence**: Configure EF Core configurations and relationships.
- [ ] **Migrations**: Generate and apply `AddCatalog` migration.

## 2. API Development (Backend)

- [ ] **DTOs**: `ProductDto`, `ProductListDto`, `CreateProductDto`, etc.
- [ ] **Services**: `ProductService`, `CategoryService`.
- [ ] **Controllers**:
  - `ProductsController` (Get, GetById, Search).
  - `CategoriesController` (GetTree).
- [ ] **Search**: Implement flexible filtering (by category, price range, brand).

## 3. Frontend Development (Next.js)

- [ ] **Components**:
  - `ProductCard`: Reusable component for lists.
  - `SidebarFilter`: For filtering products.
  - `SearchBar`: Header search input.
- [ ] **Pages**:
  - `/products`: Product Listing Page (PLP) with filters.
  - `/product/[slug]`: Product Detail Page (PDP) with images and "Add to Cart" button.
- [ ] **Integration**: Connect to Backend APIs.

## 4. Deliverables for Phase 2

- Working Catalog with dummy data.
- Search and Filter functionality.
- Responsive Product Detail viewing.

## Summary Document

- [ ] Create `Phase2_Foundation_Summary.md` to track progress.
