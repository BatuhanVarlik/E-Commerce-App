"use client";

import { useState, useEffect, useCallback } from "react";

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  blur?: boolean;
}

interface OptimizedImage {
  src: string;
  srcSet: string;
  placeholder: string;
  isLoaded: boolean;
  error: boolean;
}

/**
 * Hook for optimized image loading with blur placeholder
 */
export function useOptimizedImage(
  originalSrc: string,
  options: ImageOptimizationOptions = {},
): OptimizedImage {
  const { width, height, quality = 75, blur = true } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate optimized URL for Next.js Image Optimization
  const generateOptimizedUrl = useCallback(
    (w?: number, q?: number) => {
      if (!originalSrc) return "";

      // If it's already an external URL or data URL, return as is
      if (originalSrc.startsWith("data:") || originalSrc.startsWith("blob:")) {
        return originalSrc;
      }

      // For API images, use the original URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (
        originalSrc.startsWith(apiUrl) ||
        originalSrc.startsWith("/uploads")
      ) {
        return originalSrc;
      }

      // For Next.js image optimization
      const params = new URLSearchParams();
      params.set("url", originalSrc);
      if (w) params.set("w", w.toString());
      if (q) params.set("q", q.toString());

      return `/_next/image?${params.toString()}`;
    },
    [originalSrc],
  );

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback(() => {
    if (!originalSrc) return "";

    const widths = [640, 750, 828, 1080, 1200, 1920];
    const srcSetParts = widths
      .filter((w) => !width || w <= width * 2)
      .map((w) => `${generateOptimizedUrl(w, quality)} ${w}w`);

    return srcSetParts.join(", ");
  }, [originalSrc, width, quality, generateOptimizedUrl]);

  // Generate blur placeholder
  const generatePlaceholder = useCallback(() => {
    if (!blur) return "";

    // Simple gray placeholder
    return (
      "data:image/svg+xml;base64," +
      btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${width || 400}" height="${height || 300}">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
      </svg>`)
    );
  }, [blur, width, height]);

  useEffect(() => {
    if (!originalSrc) return;

    const img = new Image();
    img.src = generateOptimizedUrl(width, quality);

    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [originalSrc, width, quality, generateOptimizedUrl]);

  return {
    src: generateOptimizedUrl(width, quality),
    srcSet: generateSrcSet(),
    placeholder: generatePlaceholder(),
    isLoaded,
    error,
  };
}

/**
 * Hook for lazy loading images with Intersection Observer
 */
export function useLazyImage(
  src: string,
  options: IntersectionObserverInit = {},
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: "100px",
          threshold: 0.1,
          ...options,
        },
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [options],
  );

  const onLoad = useCallback(() => {
    setHasLoaded(true);
  }, []);

  return {
    ref,
    isVisible,
    hasLoaded,
    onLoad,
    shouldLoad: isVisible,
    currentSrc: isVisible ? src : undefined,
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

/**
 * Get responsive image sizes string
 */
export function getImageSizes(
  mobile: string,
  tablet: string,
  desktop: string,
): string {
  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
}

/**
 * Common image size presets
 */
export const imageSizePresets = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  productCard: { width: 300, height: 300 },
  productDetail: { width: 800, height: 800 },
  banner: { width: 1920, height: 600 },
  avatar: { width: 100, height: 100 },
};
