"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import StarRating from "@/components/StarRating";
import Image from "next/image";

interface Review {
  id: number;
  productId: number;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  isApproved: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">(
    "pending",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let endpoint = "/api/admin/reviews";
      if (filter === "pending") {
        endpoint = "/api/admin/reviews/pending";
      } else if (filter === "approved") {
        endpoint = "/api/admin/reviews?isApproved=true";
      }

      const response = await api.get<ReviewsResponse>(endpoint);

      setReviews(response.data.reviews);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "Yorumlar yüklenirken hata oluştu",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: number) => {
    try {
      await api.post(`/api/admin/reviews/${reviewId}/approve`);
      fetchReviews(); // Refresh list
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Onaylama sırasında hata oluştu");
    }
  };

  const handleReject = async (reviewId: number) => {
    try {
      await api.post(`/api/admin/reviews/${reviewId}/reject`);
      fetchReviews(); // Refresh list
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Reddetme sırasında hata oluştu");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Yorum Yönetimi
        </h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-medium transition ${
              filter === "pending"
                ? "border-b-2 border-custom-red text-custom-red"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bekleyen ({reviews?.length || 0})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 font-medium transition ${
              filter === "approved"
                ? "border-b-2 border-custom-red text-custom-red"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Onaylanan
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition ${
              filter === "all"
                ? "border-b-2 border-custom-red text-custom-red"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tümü
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-custom-red"></div>
          <p className="mt-4 text-gray-600">Yorumlar yükleniyor...</p>
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {filter === "pending"
              ? "Bekleyen yorum bulunmuyor."
              : "Yorum bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {review.productName}
                    </h3>
                    {review.isApproved && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Onaylı
                      </span>
                    )}
                    {!review.isApproved && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        Bekliyor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} readonly />
                    <span className="text-sm text-gray-600">
                      {review.userName} •{" "}
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!review.isApproved && filter === "pending" && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              {review.imageUrl &&
                typeof review.imageUrl === "string" &&
                review.imageUrl.trim().length > 0 &&
                review.imageUrl !== "string" &&
                !review.imageUrl.startsWith("string") && (
                  <div className="relative w-32 h-32 mb-4">
                    <Image
                      src={
                        review.imageUrl.startsWith("http")
                          ? review.imageUrl
                          : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5162"}${review.imageUrl}`
                      }
                      alt="Review"
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>👍 {review.helpfulCount} yararlı</span>
                <span>👎 {review.unhelpfulCount} yararsız</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
