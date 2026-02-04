"use client";

import { useState } from "react";
import { FaPaperPlane, FaEnvelope, FaGift, FaBell } from "react-icons/fa";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, send to API
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <section className="py-20 bg-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Left Side - Content */}
              <div className="text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-custom-orange/20 rounded-2xl flex items-center justify-center">
                    <FaEnvelope className="w-5 h-5 text-custom-orange" />
                  </div>
                  <span className="text-custom-orange font-medium text-sm uppercase tracking-wider">
                    Bülten
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Fırsatları Kaçırma!
                </h2>
                <p className="text-gray-400 mb-6">
                  E-bültenimize abone olun, özel indirimler ve yeni ürünlerden
                  ilk siz haberdar olun.
                </p>

                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <FaGift className="text-custom-orange w-4 h-4" />
                    <span>Hoşgeldin hediyesi: %10 indirim</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <FaBell className="text-custom-orange w-4 h-4" />
                    <span>Kampanyalardan ilk haberdar olun</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-posta adresinizi girin"
                      required
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-custom-orange focus:ring-2 focus:ring-custom-orange/20 transition-all"
                    />
                    <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-custom-orange text-white font-semibold rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                    Abone Ol
                  </button>
                </form>

                {subscribed && (
                  <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-center animate-fade-in">
                    ✓ Başarıyla abone oldunuz! İndirim kodunuz e-posta
                    adresinize gönderildi.
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-500 text-center">
                  Gizlilik politikamızı kabul etmiş olursunuz. İstediğiniz zaman
                  abonelikten çıkabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
