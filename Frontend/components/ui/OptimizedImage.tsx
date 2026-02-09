"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  placeholderColor?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
}

/**
 * Optimized Image component with:
 * - Blur placeholder
 * - Error fallback
 * - Lazy loading
 * - Responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.png",
  showPlaceholder = true,
  placeholderColor = "#e5e7eb",
  aspectRatio = "auto",
  className = "",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: "",
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden ${aspectRatioClasses[aspectRatio]} ${className}`}
      style={
        showPlaceholder && isLoading
          ? { backgroundColor: placeholderColor }
          : undefined
      }
    >
      {/* Loading shimmer */}
      {isLoading && showPlaceholder && (
        <div className="absolute inset-0 animate-pulse bg-linear-to-r from-gray-200 via-gray-100 to-gray-200" />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        {...props}
      />
    </div>
  );
}

/**
 * Product image with zoom on hover
 */
export function ProductImage({
  src,
  alt,
  className = "",
  enableZoom = true,
  ...props
}: OptimizedImageProps & { enableZoom?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => enableZoom && setIsHovered(true)}
      onMouseLeave={() => enableZoom && setIsHovered(false)}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        className={`transition-transform duration-300 ${
          isHovered ? "scale-110" : "scale-100"
        }`}
        {...props}
      />
    </div>
  );
}

/**
 * Avatar image with fallback initials
 */
export function AvatarImage({
  src,
  alt,
  name,
  size = 40,
  className = "",
}: {
  src?: string;
  alt: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name ? getInitials(name) : "?"}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

/**
 * Background image with overlay
 */
export function BackgroundImage({
  src,
  alt,
  overlay = false,
  overlayOpacity = 0.5,
  children,
  className = "",
  ...props
}: OptimizedImageProps & {
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        {...props}
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

/**
 * Image gallery with lightbox support
 */
export function ImageGallery({
  images,
  className = "",
}: {
  images: { src: string; alt: string }[];
  className?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className={className}>
      {/* Main Image */}
      <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={images[selectedIndex].src}
          alt={images[selectedIndex].alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                selectedIndex === index
                  ? "border-blue-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
