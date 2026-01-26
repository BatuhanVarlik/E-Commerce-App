"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
  const [brandName, setBrandName] = useState("");

  // Kategori seçimi için state'ler
  const [selectedLevel1, setSelectedLevel1] = useState<string>("");
  const [selectedLevel2, setSelectedLevel2] = useState<string>("");
  const [selectedLevel3, setSelectedLevel3] = useState<string>("");
  const [selectedLevel4, setSelectedLevel4] = useState<string>("");

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
          api.get("/api/Categories"),
          api.get("/api/Brands"),
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
    >,
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
      // Marka kontrolü ve oluşturma
      let brandIdToUse = formData.brandId;

      // Önce girilen isimle eşleşen marka var mı kontrol et
      const existingBrand = brands.find(
        (b) => b.name.toLowerCase() === brandName.trim().toLowerCase(),
      );

      if (existingBrand) {
        brandIdToUse = existingBrand.id;
      } else if (brandName.trim()) {
        // Yeni marka oluştur
        try {
          const brandResponse = await api.post("/api/Brands", {
            name: brandName.trim(),
          });
          brandIdToUse = brandResponse.data.id;
        } catch (error) {
          alert("Marka oluşturulamadı.");
          return;
        }
      } else {
        alert("Lütfen bir marka adı girin.");
        return;
      }

      const productData = { ...formData, brandId: brandIdToUse };

      await api.post("/api/admin/products", productData);
      alert("Ürün başarıyla oluşturuldu.");
      router.push("/admin/products");
    } catch (error) {
      console.error("Oluşturma hatası:", error);
      alert("Ürün oluşturulamadı.");
    }
  };

  // Kategori helper fonksiyonları
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.subCategories) {
        const found = findCategoryById(cat.subCategories, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getLevel2Categories = () => {
    if (!selectedLevel1) return [];
    const level1Cat = categories.find((c) => c.id === selectedLevel1);
    return level1Cat?.subCategories || [];
  };

  const getLevel3Categories = () => {
    if (!selectedLevel2) return [];
    const level2Cats = getLevel2Categories();
    const level2Cat = level2Cats.find((c) => c.id === selectedLevel2);
    return level2Cat?.subCategories || [];
  };

  const getLevel4Categories = () => {
    if (!selectedLevel3) return [];
    const level3Cats = getLevel3Categories();
    const level3Cat = level3Cats.find((c) => c.id === selectedLevel3);
    return level3Cat?.subCategories || [];
  };

  const handleLevel1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel1(value);
    setSelectedLevel2("");
    setSelectedLevel3("");
    setSelectedLevel4("");

    // Eğer alt kategori yoksa, bu kategoriyi seç
    const category = categories.find((c) => c.id === value);
    if (!category?.subCategories || category.subCategories.length === 0) {
      setFormData((prev) => ({ ...prev, categoryId: value }));
    } else {
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const handleLevel2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel2(value);
    setSelectedLevel3("");
    setSelectedLevel4("");

    const level2Cats = getLevel2Categories();
    const category = level2Cats.find((c) => c.id === value);
    if (!category?.subCategories || category.subCategories.length === 0) {
      setFormData((prev) => ({ ...prev, categoryId: value }));
    } else {
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const handleLevel3Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel3(value);
    setSelectedLevel4("");

    const level3Cats = getLevel3Categories();
    const category = level3Cats.find((c) => c.id === value);
    if (!category?.subCategories || category.subCategories.length === 0) {
      setFormData((prev) => ({ ...prev, categoryId: value }));
    } else {
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    }
  };

  const handleLevel4Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel4(value);
    setFormData((prev) => ({ ...prev, categoryId: value }));
  };

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori Seçimi
          </label>

          <div className="space-y-3">
            {/* Ana Kategori */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                1. Ana Kategori
              </label>
              <select
                required
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none bg-white"
                value={selectedLevel1}
                onChange={handleLevel1Change}
              >
                <option value="">Seçiniz</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Alt Kategori (Level 2) */}
            {selectedLevel1 && getLevel2Categories().length > 0 && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  2. Alt Kategori
                </label>
                <select
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none bg-white"
                  value={selectedLevel2}
                  onChange={handleLevel2Change}
                >
                  <option value="">Seçiniz</option>
                  {getLevel2Categories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Alt Kategori (Level 3) */}
            {selectedLevel2 && getLevel3Categories().length > 0 && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  3. Alt Kategori
                </label>
                <select
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none bg-white"
                  value={selectedLevel3}
                  onChange={handleLevel3Change}
                >
                  <option value="">Seçiniz</option>
                  {getLevel3Categories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Alt Kategori (Level 4) */}
            {selectedLevel3 && getLevel4Categories().length > 0 && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  4. Alt Kategori
                </label>
                <select
                  required
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none bg-white"
                  value={selectedLevel4}
                  onChange={handleLevel4Change}
                >
                  <option value="">Seçiniz</option>
                  {getLevel4Categories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Seçili kategori göstergesi */}
            {formData.categoryId && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✓ Kategori seçildi
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marka
          </label>
          <input
            type="text"
            name="brandName"
            required
            placeholder="Marka adı girin"
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-custom-red outline-none"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            list="brands-list"
          />
          <datalist id="brands-list">
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">
            Mevcut bir marka seçin veya yeni bir marka adı yazın
          </p>
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
