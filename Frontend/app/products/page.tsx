"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import ModernProductCard from "@/components/ModernProductCard";
import { Suspense } from "react";
import {
  FiGrid,
  FiList,
  FiFilter,
  FiX,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";

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
        className={`flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 transition-colors ${
          isSelected
            ? "bg-gray-900 text-white"
            : "hover:bg-gray-100 text-gray-700"
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <div className="flex-1 text-sm" onClick={() => onSelect(category.id)}>
          {category.name}
          <span
            className={`ml-1 ${isSelected ? "text-gray-300" : "text-gray-400"}`}
          >
            ({category.productCount})
          </span>
        </div>
        {hasSubCategories && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`ml-2 p-1 rounded transition-colors ${
              isSelected ? "hover:bg-gray-800" : "hover:bg-gray-200"
            }`}
          >
            <FiChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Skeleton */}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {filters.searchQuery
              ? `"${filters.searchQuery}" için sonuçlar`
              : "Tüm Ürünler"}
          </h1>
          <p className="mt-1 text-gray-500">{data.totalCount} ürün bulundu</p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`
              ${showFilters ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0" : "hidden"}
              lg:block w-full lg:w-72 shrink-0
            `}
          >
            {/* Mobile Filter Header */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-lg font-bold text-gray-900">Filtreler</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ara
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
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
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {searchHistory.length > 0 && !filters.searchQuery && (
                          <div className="p-3 border-b border-gray-100">
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                              Son Aramalar
                            </div>
                            {searchHistory.map((term, idx) => (
                              <button
                                key={idx}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                                onClick={() => {
                                  updateFilter("searchQuery", term);
                                  setShowSuggestions(false);
                                }}
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        )}

                        {searchSuggestions.length > 0 && (
                          <div className="p-3">
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                              Öneriler
                            </div>
                            {searchSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                  updateFilter("searchQuery", suggestion.text);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="flex-1">
                                  {suggestion.text}
                                </span>
                                <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded">
                                  {suggestion.type}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Kategori
                </label>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  <div
                    className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                      !filters.categoryId
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-100 text-gray-700"
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

              {/* Brand */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Marka
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer"
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

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Fiyat Aralığı
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Aralık: {data.filterOptions.minPrice}₺ -{" "}
                  {data.filterOptions.maxPrice}₺
                </p>
              </div>

              {/* In Stock */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    checked={filters.inStock}
                    onChange={(e) => updateFilter("inStock", e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    Sadece stokta olanlar
                  </span>
                </label>
              </div>

              {/* Filter Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <button
                  onClick={applyFilters}
                  className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Filtrele
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiFilter className="w-4 h-4" />
                  Filtreler
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Grid görünümü"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Liste görünümü"
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sort */}
              <select
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all cursor-pointer"
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

            {/* Products */}
            {data.products.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {data.products.map((product) =>
                  viewMode === "grid" ? (
                    <ModernProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      imageUrl={product.imageUrl}
                      categoryName={product.categoryName}
                    />
                  ) : (
                    <ModernProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      imageUrl={product.imageUrl}
                      categoryName={product.categoryName}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiSearch className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ürün Bulunamadı
                </h3>
                <p className="text-gray-500 max-w-md">
                  Arama kriterlerinize uygun ürün bulunamadı. Filtreleri
                  değiştirmeyi deneyin.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-6 px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label="Pagination"
              >
                <button
                  onClick={() => changePage(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Önceki
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (data.totalPages <= 7) return true;
                      if (page === 1 || page === data.totalPages) return true;
                      if (Math.abs(page - filters.page) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => changePage(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              page === filters.page
                                ? "bg-gray-900 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => changePage(filters.page + 1)}
                  disabled={filters.page === data.totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sonraki
                </button>
              </nav>
            )}
          </main>
        </div>
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
