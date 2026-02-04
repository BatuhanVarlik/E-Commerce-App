"use client";

import { FaTruck, FaShieldAlt, FaUndo, FaHeadset } from "react-icons/fa";

const features = [
  {
    icon: FaTruck,
    title: "Ücretsiz Kargo",
    description: "500₺ ve üzeri siparişlerde ücretsiz kargo",
  },
  {
    icon: FaShieldAlt,
    title: "Güvenli Ödeme",
    description: "256-bit SSL ile korunan güvenli alışveriş",
  },
  {
    icon: FaUndo,
    title: "Kolay İade",
    description: "14 gün içinde ücretsiz iade garantisi",
  },
  {
    icon: FaHeadset,
    title: "7/24 Destek",
    description: "Canlı destek ile anında yardım alın",
  },
];

export function FeatureBar() {
  return (
    <section className="py-12 bg-gray-900">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center text-white"
              >
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-custom-orange" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
