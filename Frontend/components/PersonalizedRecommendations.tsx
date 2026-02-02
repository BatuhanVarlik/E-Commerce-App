"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductCarousel from "./ProductCarousel";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stockQuantity?: number;
  categoryName?: string;
  averageRating?: number;
  reviewCount?: number;
  discountedPrice?: number;
}

export default function PersonalizedRecommendations() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        let sessionId = localStorage.getItem("sessionId");
        if (!sessionId && !user) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("sessionId", sessionId);
        }

        const url = new URL(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Recommendations/personalized`,
        );
        url.searchParams.append("count", "12");
        if (sessionId && !user) {
          url.searchParams.append("sessionId", sessionId);
        }

        const response = await fetch(url.toString(), {
          headers: {
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch personalized recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  return (
    <ProductCarousel
      title={user ? "Size Ozel Oneriler" : "Populer Urunler"}
      products={products}
      loading={loading}
    />
  );
}
