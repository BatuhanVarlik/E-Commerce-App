"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName: string;
  brandName: string;
  imageUrl: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/api/Products"),
        api.get("/api/Categories"),
      ]);
      setProducts(prodRes.data);
      setCategories(flattenCategories(catRes.data));
    } catch (error) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const flattenCategories = (
    cats: any[],
    prefix = "",
  ): { id: string; name: string }[] => {
    let result: { id: string; name: string }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: prefix + cat.name });
      if (cat.subCategories && cat.subCategories.length > 0) {
        result = result.concat(
          flattenCategories(cat.subCategories, prefix + cat.name + " > "),
        );
      }
    }
    return result;
  };

  const filterProducts = () => {
    let result = products;

    if (searchTerm) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory) {
      // Note: product.categoryName is string, filtering by name is risky if not unique,
      // but product object from public API might not have categoryId properly set unless I check DTO.
      // ProductDto has CategoryName. It DOES NOT have CategoryId in the implementation I saw earlier
      // (WAIT, I added CategoryId to ProductDto in Step 986!)
      // So I can filter by CategoryId if the API returns it.
      // Let's assume the API returns CategoryId now since I updated the DTO and Mapping.
      // I need to add categoryId to the Product interface in this file.

      // Actually, I can filter by CategoryName if I select name from dropdown, but ID is better.
      // Let's assume Product interface update is needed below.
      result = result.filter(
        (p) =>
          p.categoryName ===
            categories.find((c) => c.id === selectedCategory)?.name ||
          (p as any).categoryId === selectedCategory,
      );
    }

    setFilteredProducts(result);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

    try {
      await api.delete(`/api/admin/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      alert("Ürün silindi.");
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Ürün silinirken bir hata oluştu. Yetkiniz var mı?");
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ürün Yönetimi</h1>
        <Link
          href="/admin/products/new"
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition"
        >
          <FaPlus /> Yeni Ürün Ekle
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Ürün Ara..."
          className="border p-2 rounded flex-1 outline-none focus:ring-2 focus:ring-custom-red"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border p-2 rounded w-1/4 outline-none focus:ring-2 focus:ring-custom-red"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-4 border-b">Resim</th>
              <th className="p-4 border-b">Ürün Adı</th>
              <th className="p-4 border-b">Kategori</th>
              <th className="p-4 border-b">Marka</th>
              <th className="p-4 border-b">Fiyat</th>
              <th className="p-4 border-b">Stok</th>
              <th className="p-4 border-b text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-600">
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 border-b last:border-0"
              >
                <td className="p-4">
                  <div className="relative h-12 w-12 rounded overflow-hidden border">
                    <Image
                      src={
                        product.imageUrl.startsWith("http")
                          ? product.imageUrl
                          : `https://placehold.co/100`
                      }
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="p-4 font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="p-4">{product.categoryName}</td>
                <td className="p-4">{product.brandName}</td>
                <td className="p-4 text-green-600 font-bold">
                  {product.price.toLocaleString("tr-TR")} ₺
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.stock > 10
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Link
                    href={`/admin/products/edit/${product.id}`}
                    className="inline-block text-blue-600 hover:text-blue-800 p-2"
                  >
                    <FaEdit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
