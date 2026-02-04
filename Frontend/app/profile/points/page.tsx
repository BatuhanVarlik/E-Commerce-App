import { Metadata } from "next";
import { PointsDashboard } from "@/components/social/PointsProgram";
import { ReferralDashboard } from "@/components/social/ReferralProgram";

export const metadata: Metadata = {
  title: "Puanlarım | E-Ticaret",
  description:
    "Puan bakiyeni gör, kazanma yollarını keşfet ve puanlarını indirime çevir.",
};

export default function PointsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Puanlarım</h1>

        <div className="space-y-6">
          <PointsDashboard />

          {/* Points Info Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tier Sistemimiz
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TierCard
                name="Bronze"
                minPoints={0}
                bonus="%5"
                color="from-amber-500 to-amber-700"
                icon="🥉"
              />
              <TierCard
                name="Silver"
                minPoints={500}
                bonus="%10"
                color="from-gray-400 to-gray-600"
                icon="🥈"
              />
              <TierCard
                name="Gold"
                minPoints={2000}
                bonus="%20"
                color="from-yellow-400 to-yellow-600"
                icon="🥇"
              />
              <TierCard
                name="Platinum"
                minPoints={5000}
                bonus="%30"
                color="from-cyan-400 to-cyan-600"
                icon="💎"
              />
            </div>
          </div>

          {/* Refer Friends Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Daha Fazla Puan Kazan
            </h2>
            <ReferralDashboard />
          </div>
        </div>
      </div>
    </div>
  );
}

function TierCard({
  name,
  minPoints,
  bonus,
  color,
  icon,
}: {
  name: string;
  minPoints: number;
  bonus: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white text-center`}
    >
      <span className="text-2xl">{icon}</span>
      <h3 className="font-bold mt-2">{name}</h3>
      <p className="text-white/80 text-sm">{minPoints}+ puan</p>
      <p className="text-white font-medium mt-1">{bonus} Bonus</p>
    </div>
  );
}
