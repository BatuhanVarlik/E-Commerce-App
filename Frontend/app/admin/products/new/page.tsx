"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Sadece resim dosyaları yüklenebilir (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Resim boyutu maksimum 5MB olabilir");
      return;
    }

    setImageFile(file);
    setError("");

    // Preview oluştur
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);

    setUploading(true);
    try {
      const response = await api.post<{ url: string }>(
        "/api/Upload/product-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data.url;
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      throw new Error(error.response?.data?.message || "Resim yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

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
    setError("");

    try {
      // Önce resmi yükle
      let imageUrl = "";
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          throw new Error("Resim yüklenemedi");
        }
        imageUrl = uploadedUrl;
      } else {
        setError("Lütfen bir ürün resmi seçin");
        return;
      }

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

      const productData = { ...formData, brandId: brandIdToUse, imageUrl };

      await api.post("/api/admin/products", productData);
      alert("Ürün başarıyla oluşturuldu.");
      router.push("/admin/products");
    } catch (error) {
      console.error("Oluşturma hatası:", error);
      setError("Ürün oluşturulamadı.");
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
            Ürün Resmi
          </label>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Ürün önizleme"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="product-image"
                />
                <label htmlFor="product-image" className="cursor-pointer block">
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 mb-2"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-sm">
                      <span className="text-custom-red font-medium">
                        Dosya seçin
                      </span>{" "}
                      veya sürükleyip bırakın
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF, WEBP (Max. 5MB)
                    </p>
                  </div>
                </label>
              </div>
            )}
            {uploading && (
              <p className="text-sm text-gray-600">Resim yükleniyor...</p>
            )}
          </div>
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-custom-red text-white font-bold py-3 rounded hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? "Yükleniyor..." : "Ürünü Oluştur"}
        </button>
      </form>
    </div>
  );
}
