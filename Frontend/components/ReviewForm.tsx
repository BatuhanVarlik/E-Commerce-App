"use client";

import { useState, useRef } from "react";
import StarRating from "./StarRating";
import { api } from "@/lib/api";
import Image from "next/image";

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({
  productId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        "/api/Upload/review-image",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Lütfen yıldız puanı seçin");
      return;
    }

    setSubmitting(true);
    try {
      // Önce resmi yükle (varsa)
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Yorumu gönder
      await api.post("/api/Reviews", {
        productId,
        rating,
        comment: comment.trim(),
        imageUrl,
      });

      // Reset form
      setRating(0);
      setComment("");
      removeImage();
      onReviewSubmitted();
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message ||
          error.message ||
          "Yorum gönderilemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Ürünü Değerlendir</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Puanınız <span className="text-red-500">*</span>
        </label>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Yorumunuz <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-custom-red outline-none"
          placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."
          maxLength={1000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/1000 karakter
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resim Ekle (Opsiyonel)
        </label>

        <div className="space-y-3">
          {/* File Input */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
              id="review-image-upload"
            />
            <label
              htmlFor="review-image-upload"
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition border border-gray-300 inline-flex items-center gap-2"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Resim Seç
            </label>
            {imageFile && (
              <span className="text-sm text-gray-600">{imageFile.name}</span>
            )}
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={200}
                height={200}
                className="rounded-lg object-cover border border-gray-300"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
              >
                ×
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Maksimum 5MB, JPG, PNG, GIF veya WEBP formatında
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || uploading || rating === 0}
        className="w-full bg-custom-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading
          ? "Resim yükleniyor..."
          : submitting
            ? "Gönderiliyor..."
            : "Yorumu Gönder"}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Yorumunuz onaylandıktan sonra görünür olacaktır.
      </p>
    </form>
  );
}
