"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiShoppingBag,
  FiCheck,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError("Kullanım koşullarını kabul etmelisiniz.");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register(formData);
      window.location.href = "/login?registered=true";
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(axiosError.response?.data?.message || "Kayıt başarısız.");
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 6) return { strength: 1, label: "Zayıf" };
    if (password.length < 8) return { strength: 2, label: "Orta" };
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return { strength: 4, label: "Güçlü" };
    return { strength: 3, label: "İyi" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center p-16">
        <div className="max-w-lg">
          <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
            <FiShoppingBag className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Alışverişin Keyfine Varın
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-12">
            Hemen üye olun, özel fırsatlar ve indirimlerden yararlanın.
            Türkiye'nin en güvenilir e-ticaret platformunda yerinizi alın.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              "Özel üyelere özel kampanyalar",
              "Hızlı ve güvenli alışveriş deneyimi",
              "Ücretsiz kargo fırsatları",
              "Kolay iade ve değişim",
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <FiCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <FiShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">E-Ticaret</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hesap Oluşturun
            </h1>
            <p className="text-gray-600">Birkaç adımda ücretsiz üye olun</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => alert("Google ile Kayıt henüz yapılandırılmadı.")}
            >
              <FcGoogle className="text-xl" />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => alert("Apple ile Kayıt henüz yapılandırılmadı.")}
            >
              <FaApple className="text-xl text-black" />
              Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">
                veya e-posta ile devam edin
              </span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ad"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Adınız"
                leftIcon={<FiUser className="w-5 h-5" />}
                required
                disabled={isLoading}
              />
              <Input
                label="Soyad"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Soyadınız"
                required
                disabled={isLoading}
              />
            </div>

            <Input
              label="E-Posta"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
              leftIcon={<FiMail className="w-5 h-5" />}
              required
              disabled={isLoading}
            />

            <div>
              <Input
                label="Şifre"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="En az 6 karakter"
                leftIcon={<FiLock className="w-5 h-5" />}
                required
                disabled={isLoading}
              />
              {/* Password Strength */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.strength
                            ? passwordStrength.strength <= 1
                              ? "bg-red-500"
                              : passwordStrength.strength <= 2
                                ? "bg-yellow-500"
                                : passwordStrength.strength <= 3
                                  ? "bg-blue-500"
                                  : "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      ></div>
                    ))}
                  </div>
                  <p
                    className={`text-xs ${
                      passwordStrength.strength <= 1
                        ? "text-red-500"
                        : passwordStrength.strength <= 2
                          ? "text-yellow-600"
                          : passwordStrength.strength <= 3
                            ? "text-blue-600"
                            : "text-emerald-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 mt-0.5"
              />
              <span className="text-sm text-gray-600">
                <Link
                  href="/terms"
                  className="text-gray-900 font-medium hover:underline"
                >
                  Kullanım Koşulları
                </Link>{" "}
                ve{" "}
                <Link
                  href="/privacy"
                  className="text-gray-900 font-medium hover:underline"
                >
                  Gizlilik Politikası
                </Link>
                'nı okudum ve kabul ediyorum.
              </span>
            </label>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              rightIcon={<FiArrowRight className="w-4 h-4" />}
            >
              Kayıt Ol
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-gray-600">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-gray-900 hover:underline"
            >
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
