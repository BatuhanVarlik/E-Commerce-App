"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  threshold?: number; // Swipe için minimum mesafe
  className?: string;
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
  className = "",
}: SwipeableProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
    isHorizontal.current = null;
  };

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const deltaX = clientX - startX.current;
      const deltaY = clientY - startY.current;

      // İlk hareketin yönünü belirle
      if (
        isHorizontal.current === null &&
        (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)
      ) {
        isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      // Yatay hareket değilse devam etme
      if (isHorizontal.current === false) return;

      // Sadece izin verilen yönlere kaydır
      if (deltaX > 0 && !rightAction) return;
      if (deltaX < 0 && !leftAction) return;

      // Maksimum kaydırma limiti
      const maxTranslate = 120;
      const newTranslate = Math.max(
        -maxTranslate,
        Math.min(maxTranslate, deltaX),
      );
      setTranslateX(newTranslate);
    },
    [isDragging, leftAction, rightAction],
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(translateX) >= threshold) {
      if (translateX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (translateX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setTranslateX(0);
    isHorizontal.current = null;
  }, [isDragging, translateX, threshold, onSwipeLeft, onSwipeRight]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Global event listeners
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, {
        passive: true,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Left Action (sağa kaydırınca görünür) */}
      {rightAction && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center justify-start bg-green-500 text-white"
          style={{
            width: Math.max(0, translateX),
            opacity: translateX > 0 ? 1 : 0,
          }}
        >
          <div className="px-4">{rightAction}</div>
        </div>
      )}

      {/* Right Action (sola kaydırınca görünür) */}
      {leftAction && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-end bg-red-500 text-white"
          style={{
            width: Math.max(0, -translateX),
            opacity: translateX < 0 ? 1 : 0,
          }}
        >
          <div className="px-4">{leftAction}</div>
        </div>
      )}

      {/* Content */}
      <div
        className="relative bg-white"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
      >
        {children}
      </div>
    </div>
  );
}

// Swipe ile silinebilir liste öğesi
interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteLabel = "Sil",
  className = "",
}: SwipeToDeleteProps) {
  return (
    <Swipeable
      onSwipeLeft={onDelete}
      leftAction={<span className="font-medium text-sm">{deleteLabel}</span>}
      className={className}
    >
      {children}
    </Swipeable>
  );
}

// Carousel için swipe kontrolü
interface SwipeCarouselProps {
  children: React.ReactNode[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

export function SwipeCarousel({
  children,
  activeIndex,
  onIndexChange,
  className = "",
}: SwipeCarouselProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startX.current;
      setTranslateX(deltaX);
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    if (translateX > threshold && activeIndex > 0) {
      onIndexChange(activeIndex - 1);
    } else if (translateX < -threshold && activeIndex < children.length - 1) {
      onIndexChange(activeIndex + 1);
    }

    setTranslateX(0);
  }, [isDragging, translateX, activeIndex, children.length, onIndexChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, {
        passive: true,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${activeIndex * 100}% + ${isDragging ? translateX : 0}px))`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full shrink-0">
            {child}
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {children.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`w-2 h-2 rounded-full transition-all touch-manipulation ${
                index === activeIndex ? "bg-custom-orange w-6" : "bg-gray-300"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
