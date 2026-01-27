"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
          api.get("/api/Categories"),
          api.get("/api/Brands"),
          api.get(`/api/admin/products/${id}`),
        ]);

        setCategories(catRes.data);
        setBrands(brandRes.data);
        const p = prodRes.data;

        setFormData({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
          brandId: p.brandId,
        });
        setImagePreview(p.imageUrl); // Mevcut resmi preview olarak göster
      } catch (error) {
        console.error("Veriler çekilemedi:", error);
        alert("Ürün bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    if (file.size > 5 * 1024 * 1024) {
      setError("Resim boyutu maksimum 5MB olabilir");
      return;
    }

    setImageFile(file);
    setError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(""); // Resim tamamen kaldırılsın
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const uploadFormData = new FormData();
    uploadFormData.append("file", imageFile);

    setUploading(true);
    try {
      const response = await api.post<{ url: string }>(
        "/api/Upload/product-image",
        uploadFormData,
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
      let imageUrl = formData.imageUrl;

      // Yeni resim seçildiyse yükle
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          throw new Error("Resim yüklenemedi");
        }
        imageUrl = uploadedUrl;
      }

      await api.put(`/api/admin/products/${id}`, {
        ...formData,
        imageUrl,
      });
      alert("Ürün başarıyla güncellendi.");
      router.push("/admin/products");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setError("Ürün güncellenemedi.");
    }
  };

  const flattenCategories = (
    cats: Category[],
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
                  id="product-image-edit"
                />
                <label
                  htmlFor="product-image-edit"
                  className="cursor-pointer block"
                >
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
                        Yeni resim seçin
                      </span>
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? "Yükleniyor..." : "Güncelle"}
        </button>
      </form>
    </div>
  );
}
