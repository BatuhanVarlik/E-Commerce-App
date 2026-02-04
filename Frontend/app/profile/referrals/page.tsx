import { Metadata } from "next";
import { ReferralDashboard } from "@/components/social/ReferralProgram";
import { PointsDashboard } from "@/components/social/PointsProgram";
import { LeaderboardMini } from "@/components/social/Leaderboard";

export const metadata: Metadata = {
  title: "Arkadaşını Davet Et | E-Ticaret",
  description:
    "Arkadaşlarını davet et, puan kazan! Her başarılı davet için 100 puan kazanırsın.",
};

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Davet & Puan Programı
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ReferralDashboard />
            <PointsDashboard />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LeaderboardMini />

            {/* FAQ */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Sıkça Sorulan Sorular
              </h3>

              <div className="space-y-4">
                <FAQItem
                  question="Referans puanları ne zaman yansır?"
                  answer="Arkadaşın ilk siparişini tamamladıktan sonra puanlar otomatik olarak hesabına eklenir."
                />
                <FAQItem
                  question="Puanları nasıl kullanabilirim?"
                  answer="Ödeme sırasında puanlarını indirime çevirebilirsin. 100 puan = 10₺ indirim."
                />
                <FAQItem
                  question="Tier seviyem nasıl yükselir?"
                  answer="Toplam kazandığın puanlara göre seviye atlarsın. Bronze → Silver (500p) → Gold (2000p) → Platinum (5000p)"
                />
                <FAQItem
                  question="Davet limiti var mı?"
                  answer="Hayır, dilediğin kadar arkadaş davet edebilirsin!"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <p className="font-medium text-gray-900 text-sm">{question}</p>
      <p className="text-gray-600 text-sm mt-1">{answer}</p>
    </div>
  );
}
