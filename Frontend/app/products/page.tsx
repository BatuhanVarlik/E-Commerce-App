"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Suspense } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  categoryName: string;
}

interface CategoryOption {
  id: string;
  name: string;
  productCount: number;
  subCategories?: CategoryOption[];
}

interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  brands: { id: string; name: string; productCount: number }[];
  categories: CategoryOption[];
}

interface FilteredResponse {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  filterOptions: FilterOptions;
}

interface Filters {
  searchQuery: string;
  categoryId: string;
  brandId: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sortBy: string;
  page: number;
}

function parseFiltersFromUrl(searchParams: URLSearchParams): Filters {
  return {
    searchQuery: searchParams.get("q") || "",
    categoryId: searchParams.get("category") || "",
    brandId: searchParams.get("brand") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    inStock: searchParams.get("inStock") === "true",
    sortBy: searchParams.get("sortBy") || "name_asc",
    page: parseInt(searchParams.get("page") || "1"),
  };
}

function buildApiUrl(filters: Filters): string {
  const params = new URLSearchParams();

  if (filters.searchQuery) params.append("SearchQuery", filters.searchQuery);
  if (filters.categoryId) params.append("CategoryId", filters.categoryId);
  if (filters.brandId) params.append("BrandId", filters.brandId);
  if (filters.minPrice) params.append("MinPrice", filters.minPrice);
  if (filters.maxPrice) params.append("MaxPrice", filters.maxPrice);
  if (filters.inStock) params.append("InStock", "true");
  params.append("SortBy", filters.sortBy);
  params.append("Page", filters.page.toString());
  params.append("PageSize", "12");

  return `http://localhost:5162/api/Products/filter?${params}`;
}

function buildBrowserUrl(filters: Filters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page") {
      const urlKey =
        key === "searchQuery"
          ? "q"
          : key === "categoryId"
            ? "category"
            : key === "brandId"
              ? "brand"
              : key;
      params.set(urlKey, value.toString());
    }
  });

  if (filters.page > 1) params.set("page", filters.page.toString());

  return `/products?${params.toString()}`;
}

// Recursive kategori bileşeni
function CategoryFilter({
  category,
  selectedId,
  onSelect,
  level = 0,
}: {
  category: CategoryOption;
  selectedId: string;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubCategories =
    category.subCategories && category.subCategories.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <div
        className={`flex items-center justify-between cursor-pointer rounded p-2 hover:bg-gray-100 ${
          isSelected ? "bg-blue-50 text-blue-600 font-medium" : ""
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div className="flex-1" onClick={() => onSelect(category.id)}>
          {category.name} ({category.productCount})
        </div>
        {hasSubCategories && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="ml-2 p-1 hover:bg-gray-200 rounded"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
      {hasSubCategories && isOpen && (
        <div className="mt-1">
          {category.subCategories!.map((subCat) => (
            <CategoryFilter
              key={subCat.id}
              category={subCat}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<FilteredResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(() =>
    parseFiltersFromUrl(searchParams),
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const newFilters = parseFiltersFromUrl(searchParams);
    setFilters(newFilters);
    fetchProducts(newFilters);
  }, [searchParams]);

  const fetchProducts = async (currentFilters: Filters) => {
    setLoading(true);
    try {
      const url = buildApiUrl(currentFilters);
      const response = await axios.get(url);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (
    key: keyof Filters,
    value: string | boolean | number,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const newFilters = { ...filters, page: 1 };
    router.push(buildBrowserUrl(newFilters));
  };

  const clearFilters = () => {
    router.push("/products");
  };

  const changePage = (page: number) => {
    const newFilters = { ...filters, page };
    router.push(buildBrowserUrl(newFilters));
  };

  if (loading || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.categoryId ||
    filters.brandId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStock;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          {filters.searchQuery
            ? `"${filters.searchQuery}" için arama sonuçları`
            : "Tüm Ürünler"}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 lg:hidden"
        >
          {showFilters ? "Filtreleri Gizle" : "Filtreler"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filtreler Sidebar */}
        <aside
          className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64`}
        >
          <div className="rounded-lg bg-white p-4 shadow space-y-4">
            <h3 className="text-lg font-bold">Filtreler</h3>

            <div>
              <label className="mb-2 block text-sm font-medium">Ara</label>
              <input
                type="text"
                className="w-full rounded border p-2"
                placeholder="Ürün ara..."
                value={filters.searchQuery}
                onChange={(e) => updateFilter("searchQuery", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Kategori</label>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                <div
                  className={`cursor-pointer rounded p-2 hover:bg-gray-100 ${
                    !filters.categoryId
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : ""
                  }`}
                  onClick={() => updateFilter("categoryId", "")}
                >
                  Tüm Kategoriler
                </div>
                {data.filterOptions.categories.map((cat) => (
                  <CategoryFilter
                    key={cat.id}
                    category={cat}
                    selectedId={filters.categoryId}
                    onSelect={(id) => updateFilter("categoryId", id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Marka</label>
              <select
                className="w-full rounded border p-2"
                value={filters.brandId}
                onChange={(e) => updateFilter("brandId", e.target.value)}
              >
                <option value="">Tüm Markalar</option>
                {data.filterOptions.brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} ({brand.productCount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Fiyat Aralığı
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                />
                <input
                  type="number"
                  className="w-full rounded border p-2"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {data.filterOptions.minPrice}₺ - {data.filterOptions.maxPrice}₺
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.inStock}
                  onChange={(e) => updateFilter("inStock", e.target.checked)}
                />
                <span className="text-sm">Sadece stokta olanlar</span>
              </label>
            </div>

            <div className="space-y-2">
              <button
                onClick={applyFilters}
                className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Filtrele
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Ürünler */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {data.totalCount} ürün bulundu
            </p>
            <select
              className="rounded border p-2"
              value={filters.sortBy}
              onChange={(e) => {
                const newFilters = { ...filters, sortBy: e.target.value };
                router.push(buildBrowserUrl(newFilters));
              }}
            >
              <option value="name_asc">İsim (A-Z)</option>
              <option value="name_desc">İsim (Z-A)</option>
              <option value="price_asc">Fiyat (Düşük-Yüksek)</option>
              <option value="price_desc">Fiyat (Yüksek-Düşük)</option>
              <option value="newest">En Yeniler</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.length > 0 ? (
              data.products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-500">
                Filtrelere uygun ürün bulunamadı.
              </p>
            )}
          </div>

          {data.totalPages > 1 && (
            <nav
              className="mt-8 flex justify-center gap-2"
              aria-label="Pagination"
            >
              <button
                onClick={() => changePage(filters.page - 1)}
                disabled={filters.page === 1}
                className="rounded bg-gray-200 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Önceki
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => changePage(page)}
                    className={`rounded px-4 py-2 ${
                      page === filters.page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => changePage(filters.page + 1)}
                disabled={filters.page === data.totalPages}
                className="rounded bg-gray-200 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
              >
                Sonraki
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
