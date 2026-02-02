"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { FaTimes, FaStar, FaShoppingCart, FaArrowLeft } from "react-icons/fa";

interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  stock: number;
  categoryName: string;
  brandName: string;
  description: string;
  averageRating: number;
  reviewCount: number;
  inStock: boolean;
}

function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Memoize features to prevent recreation on each render - MUST be before any early returns
  const features = useMemo(
    () => [
      {
        key: "price",
        label: "Fiyat",
        render: (p: Product) => `${p.price.toFixed(2)} ₺`,
      },
      {
        key: "rating",
        label: "Değerlendirme",
        render: (p: Product) => (
          <div className="flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            <span>{p.averageRating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({p.reviewCount})</span>
          </div>
        ),
      },
      {
        key: "stock",
        label: "Stok Durumu",
        render: (p: Product) => (
          <span
            className={`px-2 py-1 rounded text-sm ${
              p.inStock
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {p.inStock ? "Stokta Var" : "Tükendi"}
          </span>
        ),
      },
      {
        key: "brand",
        label: "Marka",
        render: (p: Product) => p.brandName || "-",
      },
      {
        key: "category",
        label: "Kategori",
        render: (p: Product) => p.categoryName,
      },
    ],
    [],
  );

  const fetchProducts = useCallback(async (productIds: string[]) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.post("/api/Products/compare", {
        productIds,
      });
      setProducts(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Ürünler karşılaştırılamadı");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (ids) {
      const productIds = ids.split(",");
      fetchProducts(productIds);
    } else {
      setIsLoading(false);
    }
  }, [searchParams, fetchProducts]);

  const removeProduct = useCallback((productId: string) => {
    setProducts((prev) => {
      const updatedProducts = prev.filter((p) => p.id !== productId);

      // Update URL
      const ids = updatedProducts.map((p) => p.id).join(",");
      window.history.replaceState(
        {},
        "",
        `/compare${ids ? `?ids=${ids}` : ""}`,
      );

      return updatedProducts;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/products" className="text-blue-600 hover:text-blue-700">
            Ürünlere Dön
          </Link>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Karşılaştırılacak Ürün Yok
          </h2>
          <p className="text-gray-600 mb-6">
            Ürünleri karşılaştırmak için önce ürün seçmelisiniz
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Ürünlere Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/products"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <FaArrowLeft />
          <span>Ürünlere Dön</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold">Ürün Karşılaştırma</h1>
        <p className="text-gray-600 mt-2">
          {products.length} ürün karşılaştırılıyor
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left font-semibold bg-gray-50 sticky left-0 z-10">
                Özellik
              </th>
              {products.map((product) => (
                <th key={product.id} className="p-4 min-w-[250px]">
                  <div className="relative">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <FaTimes />
                    </button>
                    <Link href={`/product/${product.slug}`}>
                      <img
                        src={product.imageUrl || "/placeholder-product.png"}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg mb-3 hover:opacity-90 transition"
                      />
                    </Link>
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-semibold text-lg hover:text-blue-600 transition"
                    >
                      {product.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium bg-gray-50 sticky left-0">
                  {feature.label}
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    {typeof feature.render(product) === "string" ? (
                      feature.render(product)
                    ) : (
                      <div className="flex justify-center">
                        {feature.render(product)}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4 font-medium bg-gray-50 sticky left-0"></td>
              {products.map((product) => (
                <td key={product.id} className="p-4">
                  <div className="space-y-2">
                    <Link
                      href={`/product/${product.slug}`}
                      className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
                    >
                      Detayları Gör
                    </Link>
                    {product.inStock && (
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                        <FaShoppingCart />
                        Sepete Ekle
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {products.length < 4 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800">
            Daha fazla ürün ekleyerek karşılaştırma yapabilirsiniz (Maksimum 4
            ürün)
          </p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
      <ComparisonPageContent />
    </Suspense>
  );
}
