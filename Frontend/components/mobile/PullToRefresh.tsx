"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FaSync } from "react-icons/fa";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = "",
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      // Sadece en üstte ise pull to refresh aktif
      const scrollTop = containerRef.current?.scrollTop ?? 0;
      if (scrollTop > 0) return;

      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    },
    [disabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || disabled || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      // Sadece aşağı çekmede çalış
      if (deltaY <= 0) {
        setPullDistance(0);
        setCanRefresh(false);
        return;
      }

      // Resistance effect
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, 150);
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);
    },
    [disabled, isRefreshing, threshold],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto overscroll-none ${className}`}
      onTouchStart={handleTouchStart}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none transition-transform"
        style={{
          transform: `translateY(${pullDistance - 50}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
            canRefresh || isRefreshing
              ? "bg-custom-orange text-white"
              : "bg-white text-gray-500"
          }`}
        >
          <FaSync
            className={`w-5 h-5 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>

      {/* Refresh indicator text */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center pt-2 text-sm text-gray-500 pointer-events-none"
          style={{
            transform: `translateY(${pullDistance + 10}px)`,
            opacity: pullDistance > 20 ? 1 : 0,
          }}
        >
          {isRefreshing
            ? "Yenileniyor..."
            : canRefresh
              ? "Yenilemek için bırak"
              : "Yenilemek için çek"}
        </div>
      )}
    </div>
  );
}

// Infinite scroll component
interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number; // Bottom'a ne kadar yaklaşınca tetiklensin (px)
  className?: string;
}

export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  className = "",
}: InfiniteScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(async () => {
    if (!containerRef.current || !hasMore || isLoading || loadingRef.current)
      return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      loadingRef.current = true;
      try {
        await onLoadMore();
      } finally {
        loadingRef.current = false;
      }
    }
  }, [hasMore, isLoading, onLoadMore, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className={`overflow-y-auto ${className}`}>
      {children}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <FaSync className="w-4 h-4 animate-spin" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        </div>
      )}

      {/* End of list */}
      {!hasMore && !isLoading && (
        <div className="text-center py-4 text-sm text-gray-400">
          Daha fazla içerik yok
        </div>
      )}
    </div>
  );
}

// Skeleton loader for mobile
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const baseClasses = "bg-gray-200";
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Product card skeleton for mobile
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Skeleton variant="rectangular" className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" className="w-20 h-5" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

// List skeleton for mobile
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-lg"
        >
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
