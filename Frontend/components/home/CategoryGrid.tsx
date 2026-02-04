"use client";

import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

const defaultCategories: Category[] = [
  {
    id: "1",
    name: "Kadın Giyim",
    slug: "kadin",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80",
    productCount: 128,
  },
  {
    id: "2",
    name: "Erkek Giyim",
    slug: "erkek",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    productCount: 96,
  },
  {
    id: "3",
    name: "Aksesuar",
    slug: "aksesuar",
    image:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
    productCount: 74,
  },
  {
    id: "4",
    name: "Ayakkabı",
    slug: "ayakkabi",
    image:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80",
    productCount: 52,
  },
];

interface CategoryGridProps {
  categories?: Category[];
}

export function CategoryGrid({
  categories = defaultCategories,
}: CategoryGridProps) {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Kategorileri Keşfet
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tümünü Gör →
          </Link>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-lg aspect-[4/5] bg-gray-100"
            >
              {/* Background Image */}
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                {category.productCount && (
                  <p className="text-white/70 text-sm mt-0.5">
                    {category.productCount} ürün
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
