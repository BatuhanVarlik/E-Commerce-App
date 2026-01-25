"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  subCategories: Category[];
}

interface Brand {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: "",
    categoryId: "",
    brandId: "",
  });

  useEffect(() => {
    // Fetch options
    const fetchData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get("http://localhost:5162/api/Categories"),
          axios.get("http://localhost:5162/api/Brands"),
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (error) {
        console.error("Veriler çekilemedi:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5162/api/admin/products", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Ürün başarıyla oluşturuldu.");
      router.push("/admin/products");
    } catch (error) {
      console.error("Oluşturma hatası:", error);
      alert("Ürün oluşturulamadı.");
    }
  };

  const flattenCategories = (
    cats: Category[],
    prefix = ""
  ): { id: string; name: string }[] => {
    let result: { id: string; name: string }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: prefix + cat.name });
      if (cat.subCategories && cat.subCategories.length > 0) {
        result = result.concat(
          flattenCategories(cat.subCategories, prefix + cat.name + " > ")
        );
      }
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Yeni Ürün Ekle</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Adı
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <textarea
            name="description"
            rows={4}
            required
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiyat (₺)
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none"
              value={formData.price}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stok Adedi
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none"
              value={formData.stock}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resim URL
          </label>
          <input
            type="url"
            name="imageUrl"
            required
            placeholder="https://example.com/image.jpg"
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none"
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              name="categoryId"
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none bg-white"
              value={formData.categoryId}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marka
            </label>
            <select
              name="brandId"
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none bg-white"
              value={formData.brandId}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-custom-red text-white font-bold py-3 rounded hover:bg-red-700 transition"
        >
          Ürünü Oluştur
        </button>
      </form>
    </div>
  );
}
