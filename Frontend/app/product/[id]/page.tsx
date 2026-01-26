"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryName: string;
  brandName: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
}

interface ProductReviews {
  reviews: Review[];
  totalCount: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<ProductReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/api/Products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await api.get(`/api/Reviews/product/${id}`);
        setReviews(response.data);
      } catch (err) {
        console.error("Reviews fetch error:", err);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleReviewSubmitted = async () => {
    // Refresh reviews after new review
    try {
      const response = await api.get(`/api/Reviews/product/${id}`);
      setReviews(response.data);
      setShowReviewForm(false);
    } catch (err) {
      console.error("Error refreshing reviews:", err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (e) {
      console.error("Sepete eklenirken hata:", e);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (error || !product)
    return (
      <div className="p-10 text-center text-red-500">Ürün bulunamadı.</div>
    );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image Section */}
        <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100 lg:h-[500px]">
          <Image
            src={
              product.imageUrl.startsWith("http")
                ? product.imageUrl
                : `https://placehold.co/600?text=${product.name}`
            }
            alt={product.name}
            fill
            className="object-contain"
          />
        </div>

        {/* Details Section */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wider text-custom-orange">
            {product.brandName} • {product.categoryName}
          </span>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            {product.name}
          </h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 flex items-baseline border-b border-gray-100 pb-8">
            <span className="text-4xl font-extrabold text-custom-red">
              {product.price.toLocaleString("tr-TR")} ₺
            </span>
            <span className="ml-4 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              Stokta: {product.stock} adet
            </span>
          </div>

          <div className="mt-10">
            <button
              onClick={handleAddToCart}
              disabled={adding || isAdded}
              className={`flex w-full items-center justify-center rounded-full px-10 py-4 text-lg font-bold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 lg:w-auto disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
                isAdded
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-600"
                  : "bg-custom-red hover:bg-red-700 hover:-translate-y-1 hover:shadow-xl focus:ring-custom-red"
              }`}
            >
              {isAdded
                ? "Sepete Eklendi"
                : adding
                  ? "Ekleniyor..."
                  : "Sepete Ekle"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Müşteri Yorumları
          </h2>
          {user && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-custom-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              {showReviewForm ? "İptal" : "Yorum Yaz"}
            </button>
          )}
        </div>

        {/* Rating Summary */}
        {reviews && reviews.totalCount > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {reviews.averageRating.toFixed(1)}
                </div>
                <StarRating
                  rating={Math.round(reviews.averageRating)}
                  readonly
                  size="lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {reviews.totalCount} değerlendirme
                </p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.ratingDistribution[star] || 0;
                  const percentage =
                    reviews.totalCount > 0
                      ? (count / reviews.totalCount) * 100
                      : 0;

                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-8">{star}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-8">
            <ReviewForm
              productId={id}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>
        )}

        {/* Reviews List */}
        {reviews && reviews.reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onVote={handleReviewSubmitted}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Bu ürün için henüz yorum yapılmamış.
            </p>
            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="mt-4 text-custom-red font-semibold hover:underline"
              >
                İlk yorumu siz yapın!
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
