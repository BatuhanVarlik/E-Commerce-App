"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";

interface Category {
  id: string;
  name: string;
  subCategories: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [subSubCategoryId, setSubSubCategoryId] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5162/api/Categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Kategoriler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCatName) return;
    try {
      const token = localStorage.getItem("token");
      const payload: { name: string; parentId?: string } = { name: newCatName };

      // En derin seviyeyi seç (4. > 3. > 2. > 1. > Ana)
      if (subSubCategoryId) {
        payload.parentId = subSubCategoryId;
      } else if (subCategoryId) {
        payload.parentId = subCategoryId;
      } else if (parentCategoryId) {
        payload.parentId = parentCategoryId;
      }

      await axios.post("http://localhost:5162/api/admin/categories", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewCatName("");
      setParentCategoryId("");
      setSubCategoryId("");
      setSubSubCategoryId("");
      fetchCategories();
    } catch (error) {
      alert("Kategori oluşturulamadı.");
    }
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5162/api/admin/categories/${deletingCategory.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      alert("Kategori silinemedi.");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !editName) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5162/api/admin/categories/${editingCategory.id}`,
        { name: editName },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setEditingCategory(null);
      setEditName("");
      fetchCategories();
    } catch (error) {
      alert("Kategori güncellenemedi.");
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  // Kategorileri recursive olarak render eden fonksiyon
  const renderCategory = (cat: Category, level: number = 0) => (
    <li key={cat.id} className="border-b last:border-0 pb-2">
      <div className="flex items-center justify-between">
        <span className="font-bold">{cat.name}</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(cat)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Düzenle"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(cat)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Sil"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      {cat.subCategories && cat.subCategories.length > 0 && (
        <ul className={`ml-6 mt-2 text-sm text-gray-600`}>
          {cat.subCategories.map((sub) => renderCategory(sub, level + 1))}
        </ul>
      )}
    </li>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Kategoriler</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Yeni Kategori Ekle</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Kategori Adı
            </label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              placeholder="Kategori Adı"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Üst Kategori (Opsiyonel)
            </label>
            <select
              className="border p-2 rounded w-full"
              value={parentCategoryId}
              onChange={(e) => {
                setParentCategoryId(e.target.value);
                setSubCategoryId(""); // Üst kategori değişince alt kategoriyi sıfırla
                setSubSubCategoryId(""); // 3. seviyeyi de sıfırla
              }}
            >
              <option value="">Ana Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Boş bırakırsanız ana kategori olarak eklenir.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Alt Kategori (Opsiyonel)
            </label>
            <select
              className="border p-2 rounded w-full"
              value={subCategoryId}
              onChange={(e) => {
                setSubCategoryId(e.target.value);
                setSubSubCategoryId(""); // Alt kategori değişince 3. seviyeyi sıfırla
              }}
              disabled={!parentCategoryId}
            >
              <option value="">Seçiniz</option>
              {parentCategoryId &&
                categories
                  .find((cat) => cat.id === parentCategoryId)
                  ?.subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Önce bir üst kategori seçerseniz, onun alt kategorilerini
              görebilirsiniz.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              3. Seviye Kategori (Opsiyonel)
            </label>
            <select
              className="border p-2 rounded w-full"
              value={subSubCategoryId}
              onChange={(e) => setSubSubCategoryId(e.target.value)}
              disabled={!subCategoryId}
            >
              <option value="">Seçiniz</option>
              {subCategoryId &&
                categories
                  .find((cat) => cat.id === parentCategoryId)
                  ?.subCategories.find((sub) => sub.id === subCategoryId)
                  ?.subCategories.map((subSub) => (
                    <option key={subSub.id} value={subSub.id}>
                      {subSub.name}
                    </option>
                  ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Bir alt kategori seçerseniz, onun alt kategorilerini
              görebilirsiniz.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ul className="space-y-2">
          {categories.map((cat) => renderCategory(cat))}
        </ul>
      </div>

      {/* Silme Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Kategori Sil
            </h2>
            <p className="mb-6 text-gray-700">
              <span className="font-semibold">{deletingCategory.name}</span>{" "}
              kategorisini silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeletingCategory(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editingCategory && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Kategori Düzenle</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Kategori Adı
              </label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setEditName("");
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
