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

interface SimilarProductsProps {
  productId: string;
}

export default function SimilarProducts({ productId }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Recommendations/similar/${productId}?count=12`,
        );

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch similar products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchSimilarProducts();
    }
  }, [productId]);

  return (
    <ProductCarousel
      title="Benzer Urunler"
      products={products}
      loading={loading}
    />
  );
}
