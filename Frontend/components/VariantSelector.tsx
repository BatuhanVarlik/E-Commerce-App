"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface VariantValue {
  id: string;
  value: string;
  displayName?: string;
  colorCode?: string;
  displayOrder: number;
  isActive: boolean;
}

interface VariantOption {
  id: string;
  name: string;
  type: "Color" | "Size" | "Material" | "Style" | "Custom";
  values: VariantValue[];
  displayOrder: number;
}

interface ProductVariant {
  id: string;
  productId: string;
  color?: string;
  size?: string;
  material?: string;
  style?: string;
  sku: string;
  priceAdjustment?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  additionalImages: string[];
  isActive: boolean;
  isDefault: boolean;
  weight?: number;
  dimensions?: string;
}

interface VariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantChange?: (
    variant: ProductVariant | null,
    finalPrice: number,
  ) => void;
}

export default function VariantSelector({
  productId,
  basePrice,
  onVariantChange,
}: VariantSelectorProps) {
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedOptions).length > 0) {
      findMatchingVariant();
    }
  }, [selectedOptions, variants]);

  const fetchVariants = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ProductVariants/product/${productId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
        setVariantOptions(data.variantOptions || []);

        // Set default variant if exists
        const defaultVariant = data.variants?.find(
          (v: ProductVariant) => v.isDefault,
        );
        if (defaultVariant) {
          setSelectedVariant(defaultVariant);
          const defaultOptions: Record<string, string> = {};
          if (defaultVariant.color)
            defaultOptions["Color"] = defaultVariant.color;
          if (defaultVariant.size) defaultOptions["Size"] = defaultVariant.size;
          if (defaultVariant.material)
            defaultOptions["Material"] = defaultVariant.material;
          if (defaultVariant.style)
            defaultOptions["Style"] = defaultVariant.style;
          setSelectedOptions(defaultOptions);

          const finalPrice = basePrice + (defaultVariant.priceAdjustment || 0);
          onVariantChange?.(defaultVariant, finalPrice);
        }
      }
    } catch (error) {
      console.error("Varyantlar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const findMatchingVariant = () => {
    const matching = variants.find((variant) => {
      return Object.entries(selectedOptions).every(([type, value]) => {
        switch (type) {
          case "Color":
            return variant.color === value;
          case "Size":
            return variant.size === value;
          case "Material":
            return variant.material === value;
          case "Style":
            return variant.style === value;
          default:
            return true;
        }
      });
    });

    setSelectedVariant(matching || null);
    if (matching) {
      const finalPrice = basePrice + (matching.priceAdjustment || 0);
      onVariantChange?.(matching, finalPrice);
    } else {
      onVariantChange?.(null, basePrice);
    }
  };

  const handleOptionSelect = (type: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const renderColorOption = (option: VariantOption) => {
    return (
      <div key={option.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {option.name}
        </label>
        <div className="flex flex-wrap gap-2">
          {option.values
            .filter((v) => v.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((value) => (
              <button
                key={value.id}
                onClick={() => handleOptionSelect(option.name, value.value)}
                className={`relative group ${
                  selectedOptions[option.name] === value.value
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : "ring-1 ring-gray-300"
                } rounded-lg p-1 transition-all hover:ring-2 hover:ring-blue-400`}
                title={value.displayName || value.value}
              >
                <div
                  className="w-10 h-10 rounded-md"
                  style={{ backgroundColor: value.colorCode || "#ccc" }}
                />
                {selectedOptions[option.name] === value.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white drop-shadow-lg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value.displayName || value.value}
                </span>
              </button>
            ))}
        </div>
      </div>
    );
  };

  const renderSizeOption = (option: VariantOption) => {
    return (
      <div key={option.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {option.name}
        </label>
        <div className="flex flex-wrap gap-2">
          {option.values
            .filter((v) => v.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((value) => (
              <button
                key={value.id}
                onClick={() => handleOptionSelect(option.name, value.value)}
                className={`px-4 py-2 border rounded-lg transition-all ${
                  selectedOptions[option.name] === value.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {value.displayName || value.value}
              </button>
            ))}
        </div>
      </div>
    );
  };

  const renderGenericOption = (option: VariantOption) => {
    return (
      <div key={option.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {option.name}
        </label>
        <select
          value={selectedOptions[option.name] || ""}
          onChange={(e) => handleOptionSelect(option.name, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Seçiniz</option>
          {option.values
            .filter((v) => v.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((value) => (
              <option key={value.id} value={value.value}>
                {value.displayName || value.value}
              </option>
            ))}
        </select>
      </div>
    );
  };

  const renderOption = (option: VariantOption) => {
    switch (option.type) {
      case "Color":
        return renderColorOption(option);
      case "Size":
        return renderSizeOption(option);
      default:
        return renderGenericOption(option);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (variantOptions.length === 0) {
    return null; // No variants available
  }

  return (
    <div className="space-y-4">
      {variantOptions
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((option) => renderOption(option))}

      {selectedVariant && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Seçilen Varyant:
            </span>
            <span className="text-sm text-gray-600">
              SKU: {selectedVariant.sku}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Stok Durumu:</span>
            <span
              className={`text-sm font-medium ${
                selectedVariant.stockQuantity >
                selectedVariant.lowStockThreshold
                  ? "text-green-600"
                  : selectedVariant.stockQuantity > 0
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {selectedVariant.stockQuantity > 0
                ? `${selectedVariant.stockQuantity} adet mevcut`
                : "Stokta yok"}
              {selectedVariant.stockQuantity <=
                selectedVariant.lowStockThreshold &&
                selectedVariant.stockQuantity > 0 && (
                  <span className="ml-1">(Az kaldı!)</span>
                )}
            </span>
          </div>

          {selectedVariant.priceAdjustment !== 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Fiyat Farkı:</span>
              <span
                className={`text-sm font-medium ${
                  (selectedVariant.priceAdjustment || 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {(selectedVariant.priceAdjustment || 0) > 0 ? "+" : ""}
                {selectedVariant.priceAdjustment?.toFixed(2)} TL
              </span>
            </div>
          )}

          {selectedVariant.imageUrl && (
            <div className="mt-3">
              <Image
                src={selectedVariant.imageUrl}
                alt="Varyant görseli"
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      )}

      {Object.keys(selectedOptions).length > 0 && !selectedVariant && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Seçilen kombinasyon stokta bulunmamaktadır. Lütfen farklı bir
            seçenek deneyin.
          </p>
        </div>
      )}
    </div>
  );
}
