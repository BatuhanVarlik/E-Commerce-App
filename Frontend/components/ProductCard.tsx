"use client";

import Image from "next/image";
import Link from "next/link";

interface ProductProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryName: string;
}

export default function ProductCard({
  id,
  name,
  price,
  imageUrl,
  categoryName,
}: ProductProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100 hover:border-custom-light-gold">
      <Link
        href={`/product/${id}`}
        className="relative h-64 w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4"
      >
        <Image
          src={
            imageUrl.startsWith("http")
              ? imageUrl
              : `https://placehold.co/400?text=${name}`
          }
          alt={name}
          fill
          className="object-contain transition duration-500 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-custom-orange/80">
          {categoryName}
        </p>
        <h3 className="mb-2 text-base font-bold text-gray-800 group-hover:text-custom-red transition-colors line-clamp-2">
          <Link href={`/product/${id}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {name}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-xl font-bold text-custom-red">
            {price.toLocaleString("tr-TR")} ₺
          </p>
          <span className="text-xs font-medium text-gray-400 group-hover:text-custom-gold transition-colors">
            İncele &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
