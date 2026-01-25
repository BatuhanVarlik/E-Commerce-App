"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

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

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);

  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5162/api/Products/${id}`
        );
        setProduct(response.data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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
    </div>
  );
}
