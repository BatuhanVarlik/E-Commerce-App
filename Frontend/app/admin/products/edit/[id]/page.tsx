"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  subCategories: Category[];
}

interface Brand {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [catRes, brandRes, prodRes] = await Promise.all([
          axios.get("http://localhost:5162/api/Categories"),
          axios.get("http://localhost:5162/api/Brands"),
          axios.get(`http://localhost:5162/api/admin/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setCategories(catRes.data);
        setBrands(brandRes.data);
        const p = prodRes.data;

        // Need to find categoryId/brandId from names if API returns object with names,
        // BUT GetProductByIdAsync returns ProductDto which has CategoryName/BrandName but NOT IDs?
        // Wait, check ProductDto.
        // ProductDto: Id, Name, Slug, Description, Price, Stock, ImageUrl, CategoryName, BrandName.
        // It DOES NOT have CategoryId or BrandId.
        // This is a problem for Editing. I need the IDs to pre-fill the form.

        // FIX: I need to update ProductDto to include CategoryId and BrandId, OR create an AdminProductDto.
        // I will update ProductDtos.cs to include IDs.

        // For now, assuming I will fix backend, let's map what we have.
        setFormData({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId, // Ensure DTO has this
          brandId: p.brandId, // Ensure DTO has this
        });
      } catch (error) {
        console.error("Veriler çekilemedi:", error);
        alert("Ürün bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

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
      await axios.put(
        `http://localhost:5162/api/admin/products/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Ürün başarıyla güncellendi.");
      router.push("/admin/products");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Ürün güncellenemedi.");
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

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Ürün Düzenle</h1>

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
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition"
        >
          Güncelle
        </button>
      </form>
    </div>
  );
}
