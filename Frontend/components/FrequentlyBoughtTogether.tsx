"use client";

import { useEffect, useState } from "react";
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

interface FrequentlyBoughtTogetherProps {
  productId: string;
}

export default function FrequentlyBoughtTogether({
  productId,
}: FrequentlyBoughtTogetherProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Recommendations/frequently-bought-together/${productId}?count=12`,
        );

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch frequently bought together:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProducts();
    }
  }, [productId]);

  return (
    <ProductCarousel
      title="Sikca Birlikte Alinanlar"
      products={products}
      loading={loading}
    />
  );
}
