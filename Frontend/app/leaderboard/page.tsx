import { Metadata } from "next";
import { Leaderboard } from "@/components/social/Leaderboard";
import { PointsBadge } from "@/components/social/PointsProgram";

export const metadata: Metadata = {
  title: "Liderlik Tablosu | E-Ticaret",
  description:
    "En çok puan kazanan kullanıcıları gör ve sıralamada yerini keşfet!",
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Liderlik Tablosu</h1>
          <PointsBadge />
        </div>

        <Leaderboard />

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            🚀 Sıralamayı Yükseltmenin Yolları
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TipCard
              icon="🛒"
              title="Alışveriş Yap"
              description="Her 10₺'lik alışverişte 1 puan kazan"
            />
            <TipCard
              icon="👥"
              title="Arkadaş Davet Et"
              description="Her başarılı davette 100 puan kazan"
            />
            <TipCard
              icon="⭐"
              title="Değerlendirme Yaz"
              description="Ürün değerlendirmelerinden 10 puan kazan"
            />
            <TipCard
              icon="📅"
              title="Günlük Giriş"
              description="Her gün giriş yaparak 5 puan kazan"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TipCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
