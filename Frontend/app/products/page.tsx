"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Suspense } from "react";
import Image from "next/image";

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

interface SearchSuggestion {
  text: string;
  type: "product" | "category" | "brand";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveSearchToHistory = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      const updated = [
        query,
        ...searchHistory.filter((q) => q !== query),
      ].slice(0, 5);
      setSearchHistory(updated);
      localStorage.setItem("searchHistory", JSON.stringify(updated));
    },
    [searchHistory],
  );

  const fetchProducts = useCallback(
    async (currentFilters: Filters) => {
      setLoading(true);
      try {
        const url = buildApiUrl(currentFilters);
        const response = await api.get(url);
        setData(response.data);

        // Save search to history when results are loaded
        if (currentFilters.searchQuery) {
          saveSearchToHistory(currentFilters.searchQuery);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    [saveSearchToHistory],
  );

  useEffect(() => {
    const newFilters = parseFiltersFromUrl(searchParams);
    setFilters(newFilters);
    fetchProducts(newFilters);
  }, [searchParams, fetchProducts]);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await api.get(
        `http://localhost:5162/api/Products/autocomplete?q=${encodeURIComponent(query)}`,
      );
      const suggestions: SearchSuggestion[] = response.data.suggestions.map(
        (s: { text: string; type: string }) => ({
          text: s.text,
          type: s.type as "product" | "category" | "brand",
        }),
      );

      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
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
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    router.push("/products");
    setShowSuggestions(false);
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
        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded bg-gray-200 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition ${
                viewMode === "grid" ? "bg-white shadow" : "hover:bg-gray-300"
              }`}
              title="Grid görünümü"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition ${
                viewMode === "list" ? "bg-white shadow" : "hover:bg-gray-300"
              }`}
              title="Liste görünümü"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 lg:hidden"
          >
            {showFilters ? "Filtreleri Gizle" : "Filtreler"}
          </button>
        </div>
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
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded border p-2"
                  placeholder="Ürün ara..."
                  value={filters.searchQuery}
                  onChange={(e) => {
                    updateFilter("searchQuery", e.target.value);
                    fetchSuggestions(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions &&
                  (searchSuggestions.length > 0 ||
                    searchHistory.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchHistory.length > 0 && !filters.searchQuery && (
                        <div className="p-2 border-b">
                          <div className="text-xs text-gray-500 mb-1">
                            Son Aramalar
                          </div>
                          {searchHistory.map((term, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                              onClick={() => {
                                updateFilter("searchQuery", term);
                                setShowSuggestions(false);
                              }}
                            >
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {term}
                            </button>
                          ))}
                        </div>
                      )}

                      {searchSuggestions.length > 0 && (
                        <div className="p-2">
                          <div className="text-xs text-gray-500 mb-1">
                            Öneriler
                          </div>
                          {searchSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                              onClick={() => {
                                updateFilter("searchQuery", suggestion.text);
                                setShowSuggestions(false);
                              }}
                            >
                              {suggestion.type === "product" && (
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              )}
                              {suggestion.type === "category" && (
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                  />
                                </svg>
                              )}
                              {suggestion.type === "brand" && (
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                  />
                                </svg>
                              )}
                              <div className="flex-1">
                                <span>{suggestion.text}</span>
                                <span className="ml-2 text-xs text-gray-400 capitalize">
                                  ({suggestion.type})
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>
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

          <div
            className={`${
              viewMode === "grid"
                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-4"
            }`}
          >
            {data.products.length > 0 ? (
              data.products.map((product) =>
                viewMode === "grid" ? (
                  <ProductCard key={product.id} {...product} />
                ) : (
                  <div
                    key={product.id}
                    className="flex gap-4 bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                  >
                    <div className="relative w-32 h-32">
                      <Image
                        src={product.imageUrl || "/placeholder.png"}
                        alt={product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {product.categoryName}
                      </p>
                      <p className="text-2xl font-bold text-custom-red mb-2">
                        {product.price} ₺
                      </p>
                      <a
                        href={`/product/${product.slug}`}
                        className="inline-block bg-custom-red text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      >
                        Detayları Gör
                      </a>
                    </div>
                  </div>
                ),
              )
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
