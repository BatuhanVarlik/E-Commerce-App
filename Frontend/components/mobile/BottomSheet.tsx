"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaTimes } from "react-icons/fa";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showHandle?: boolean;
  snapPoints?: number[]; // Height percentages like [0.5, 0.9]
  defaultSnapPoint?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showHandle = true,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
}: BottomSheetProps) {
  const [currentHeight, setCurrentHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const isOpenRef = useRef(isOpen);

  const getSnapHeight = useCallback(
    (index: number) => {
      if (typeof window === "undefined") return 0;
      return window.innerHeight * snapPoints[index];
    },
    [snapPoints],
  );

  // Track isOpen changes
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Sheet'i aç - using layout effect pattern
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to defer state update
      const frame = requestAnimationFrame(() => {
        if (isOpenRef.current) {
          setCurrentHeight(getSnapHeight(defaultSnapPoint));
        }
      });
      document.body.style.overflow = "hidden";
      return () => cancelAnimationFrame(frame);
    } else {
      // Use requestAnimationFrame for closing too
      const frame = requestAnimationFrame(() => {
        if (!isOpenRef.current) {
          setCurrentHeight(0);
        }
      });
      document.body.style.overflow = "unset";
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen, defaultSnapPoint, getSnapHeight]);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Drag işlemleri
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    startHeight.current = currentHeight;
  };

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const deltaY = startY.current - clientY;
      const newHeight = Math.max(
        0,
        Math.min(window.innerHeight * 0.95, startHeight.current + deltaY),
      );
      setCurrentHeight(newHeight);
    },
    [isDragging],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // En yakın snap point'e git
    const snapHeights = snapPoints.map((_, i) => getSnapHeight(i));
    const closestSnap = snapHeights.reduce((prev, curr) =>
      Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight)
        ? curr
        : prev,
    );

    // Eğer çok aşağı çekildiyse kapat
    if (currentHeight < getSnapHeight(0) * 0.5) {
      onClose();
    } else {
      setCurrentHeight(closestSnap);
    }
  }, [isDragging, currentHeight, snapPoints, getSnapHeight, onClose]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    },
    [handleDragMove],
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleDragMove(e.clientY);
    },
    [handleDragMove],
  );

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    handleTouchMove,
    handleTouchEnd,
    handleMouseMove,
    handleMouseUp,
  ]);

  if (!isOpen && currentHeight === 0) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform"
        style={{
          height: currentHeight,
          transition: isDragging ? "none" : "height 0.3s ease-out",
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Kapat"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{
            height: `calc(100% - ${showHandle ? "40px" : "0px"} - ${title ? "60px" : "0px"})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Filter için özelleştirilmiş bottom sheet
interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  children: React.ReactNode;
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  onApply,
  children,
}: FilterBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filtreler"
      snapPoints={[0.7, 0.9]}
      defaultSnapPoint={0}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 overflow-y-auto">{children}</div>
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation font-medium"
            >
              İptal
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-custom-orange text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation font-medium"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

// Sort için özelleştirilmiş bottom sheet
interface SortOption {
  value: string;
  label: string;
}

interface SortBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: SortOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export function SortBottomSheet({
  isOpen,
  onClose,
  options,
  selectedValue,
  onSelect,
}: SortBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Sırala"
      snapPoints={[0.4, 0.6]}
      defaultSnapPoint={0}
    >
      <div className="p-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors touch-manipulation ${
              selectedValue === option.value
                ? "bg-custom-orange/10 text-custom-orange"
                : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            }`}
          >
            <span className="font-medium">{option.label}</span>
            {selectedValue === option.value && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

// Confirmation dialog bottom sheet
interface ConfirmBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
}

export function ConfirmBottomSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "default",
}: ConfirmBottomSheetProps) {
  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800",
    warning: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
    default: "bg-custom-orange hover:bg-orange-600 active:bg-orange-700",
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.35]}
      defaultSnapPoint={0}
    >
      <div className="p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-4 text-white rounded-lg transition-colors touch-manipulation font-medium ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
