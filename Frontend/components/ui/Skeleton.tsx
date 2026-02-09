"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

/**
 * Base Skeleton component for loading states
 */
export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const baseClasses = "bg-gray-200";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full h-48" animation="pulse" />

      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-16" variant="rounded" />

        {/* Title */}
        <Skeleton className="h-5 w-full" variant="rounded" />
        <Skeleton className="h-5 w-3/4" variant="rounded" />

        {/* Rating */}
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4" variant="circular" />
          ))}
          <Skeleton className="h-3 w-8 ml-2" variant="rounded" />
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" variant="rounded" />
          <Skeleton className="h-8 w-8" variant="circular" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product Grid Skeleton
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Product Detail Skeleton
 */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <Skeleton className="w-full aspect-square" variant="rounded" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-20 h-20" variant="rounded" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" variant="rounded" />
          <Skeleton className="h-8 w-3/4" variant="rounded" />

          {/* Rating */}
          <div className="flex items-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-5" variant="circular" />
            ))}
            <Skeleton className="h-4 w-20 ml-2" variant="rounded" />
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" variant="rounded" />
            <Skeleton className="h-6 w-24" variant="rounded" />
          </div>

          {/* Description */}
          <div className="space-y-2 py-4">
            <Skeleton className="h-4 w-full" variant="rounded" />
            <Skeleton className="h-4 w-full" variant="rounded" />
            <Skeleton className="h-4 w-3/4" variant="rounded" />
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" variant="rounded" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-10" variant="rounded" />
              ))}
            </div>
          </div>

          {/* Add to Cart */}
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 flex-1" variant="rounded" />
            <Skeleton className="h-12 w-12" variant="rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Item Skeleton
 */
export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg">
      <Skeleton className="w-20 h-20" variant="rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" variant="rounded" />
        <Skeleton className="h-4 w-24" variant="rounded" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" variant="rounded" />
          <Skeleton className="h-6 w-20" variant="rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Skeleton
 */
export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <CartItemSkeleton key={i} />
      ))}
      <div className="bg-white rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" variant="rounded" />
          <Skeleton className="h-4 w-20" variant="rounded" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" variant="rounded" />
          <Skeleton className="h-4 w-16" variant="rounded" />
        </div>
        <div className="border-t pt-3 flex justify-between">
          <Skeleton className="h-6 w-20" variant="rounded" />
          <Skeleton className="h-6 w-24" variant="rounded" />
        </div>
        <Skeleton className="h-12 w-full" variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Order Card Skeleton
 */
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" variant="rounded" />
        <Skeleton className="h-6 w-24" variant="rounded" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16" variant="rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" variant="rounded" />
          <Skeleton className="h-3 w-1/2" variant="rounded" />
        </div>
        <Skeleton className="h-5 w-20" variant="rounded" />
      </div>
      <div className="flex justify-between pt-2 border-t">
        <Skeleton className="h-4 w-28" variant="rounded" />
        <Skeleton className="h-4 w-24" variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" variant="rounded" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table Skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" variant="rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Review Card Skeleton
 */
export function ReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10" variant="circular" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" variant="rounded" />
          <Skeleton className="h-3 w-16" variant="rounded" />
        </div>
      </div>
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-4" variant="circular" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" variant="rounded" />
        <Skeleton className="h-4 w-full" variant="rounded" />
        <Skeleton className="h-4 w-2/3" variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-24 h-24" variant="circular" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" variant="rounded" />
          <Skeleton className="h-4 w-48" variant="rounded" />
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" variant="rounded" />
            <Skeleton className="h-10 w-full" variant="rounded" />
          </div>
        ))}
      </div>

      <Skeleton className="h-12 w-32" variant="rounded" />
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" variant="rounded" />
              <Skeleton className="h-8 w-24" variant="rounded" />
            </div>
            <Skeleton className="w-12 h-12" variant="circular" />
          </div>
          <Skeleton className="h-3 w-16 mt-2" variant="rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Category List Skeleton
 */
export function CategoryListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-lg"
        >
          <Skeleton className="w-10 h-10" variant="rounded" />
          <Skeleton className="h-4 flex-1" variant="rounded" />
          <Skeleton className="h-4 w-8" variant="rounded" />
        </div>
      ))}
    </div>
  );
}

// Export all components
export default {
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailSkeleton,
  CartItemSkeleton,
  CartSkeleton,
  OrderCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ReviewCardSkeleton,
  ProfileSkeleton,
  DashboardStatsSkeleton,
  CategoryListSkeleton,
};
