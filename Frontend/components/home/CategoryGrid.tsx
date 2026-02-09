"use client";

import Link from "next/link";
import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount?: number;
  description?: string;
}

const defaultCategories: Category[] = [
  {
    id: "1",
    name: "Kadın",
    slug: "kadin",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80",
    productCount: 128,
    description: "En yeni trendler",
  },
  {
    id: "2",
    name: "Erkek",
    slug: "erkek",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    productCount: 96,
    description: "Şık ve rahat",
  },
  {
    id: "3",
    name: "Aksesuar",
    slug: "aksesuar",
    image:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
    productCount: 74,
    description: "Tarzını tamamla",
  },
  {
    id: "4",
    name: "Ayakkabı",
    slug: "ayakkabi",
    image:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80",
    productCount: 52,
    description: "Adımlarını renklendir",
  },
];

interface CategoryGridProps {
  categories?: Category[];
  title?: string;
  subtitle?: string;
  layout?: "default" | "featured" | "masonry";
  columns?: 2 | 3 | 4;
  showViewAll?: boolean;
}

export function CategoryGrid({
  categories = defaultCategories,
  title = "Kategorileri Keşfet",
  subtitle,
  layout = "default",
  columns = 4,
  showViewAll = true,
}: CategoryGridProps) {
  // Featured layout
  if (layout === "featured" && categories.length >= 3) {
    return (
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            {subtitle && (
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                {subtitle}
              </p>
            )}
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {title}
            </h2>
          </div>

          {/* Featured Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Large Featured Item */}
            <CategoryCard
              category={categories[0]}
              variant="large"
              className="lg:row-span-2"
            />

            {/* Smaller Items */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {categories.slice(1, 5).map((cat) => (
                <CategoryCard key={cat.id} category={cat} variant="small" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Masonry layout
  if (layout === "masonry") {
    return (
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {subtitle && (
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                {subtitle}
              </p>
            )}
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              {title}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((cat, index) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                variant={index === 0 ? "medium" : "small"}
                className={index === 0 ? "md:col-span-2 md:row-span-2" : ""}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Column configurations
  const gridColumns = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  // Default layout
  return (
    <section className="py-12 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            {subtitle && (
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                {subtitle}
              </p>
            )}
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          {showViewAll && (
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Tümünü Gör
              <FiArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Category Cards */}
        <div className={`grid ${gridColumns[columns]} gap-4 lg:gap-6`}>
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        {/* Mobile View All */}
        {showViewAll && (
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Tümünü Gör
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Category Card Component
interface CategoryCardProps {
  category: Category;
  variant?: "small" | "medium" | "large";
  className?: string;
}

function CategoryCard({
  category,
  variant = "medium",
  className = "",
}: CategoryCardProps) {
  const aspectRatios = {
    small: "aspect-square",
    medium: "aspect-[4/5]",
    large: "aspect-[4/3] lg:aspect-auto lg:h-full min-h-[300px]",
  };

  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={`group relative block overflow-hidden rounded-xl ${aspectRatios[variant]} ${className}`}
    >
      {/* Image */}
      <Image
        src={category.image}
        alt={category.name}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
        <h3 className="text-white text-lg lg:text-xl font-semibold">
          {category.name}
        </h3>

        {category.description && variant !== "small" && (
          <p className="text-white/80 text-sm mt-1">{category.description}</p>
        )}

        {category.productCount && (
          <p className="text-white/60 text-sm mt-2">
            {category.productCount} Ürün
          </p>
        )}

        {/* Hover Arrow */}
        <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <FiArrowRight className="w-5 h-5 text-gray-900" />
        </div>
      </div>
    </Link>
  );
}

// Circular Categories - Horizontal scroll
interface CircularCategoriesProps {
  categories?: Category[];
  title?: string;
}

export function CircularCategories({
  categories = defaultCategories,
  title = "Kategoriler",
}: CircularCategoriesProps) {
  return (
    <section className="py-12 lg:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 text-center mb-8">
            {title}
          </h2>
        )}

        <div className="flex gap-6 lg:gap-8 overflow-x-auto pb-4 scrollbar-hide justify-start lg:justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-3 flex-shrink-0 group"
            >
              {/* Circle Image */}
              <div className="relative w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-gray-900 transition-all duration-300 group-hover:shadow-lg">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Name */}
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors whitespace-nowrap">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryGrid;
