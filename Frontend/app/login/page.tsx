"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaApple } from "react-icons/fa";
import { FiMail, FiLock, FiArrowRight, FiShoppingBag } from "react-icons/fi";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      login(response.data);

      if (response.data.role === "Admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(axiosError.response?.data?.message || "Giriş başarısız.");
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    try {
      setError("");
      setIsLoading(true);

      if (!credentialResponse.credential) {
        throw new Error("Google credential alınamadı");
      }

      const response = await authApi.googleLogin(credentialResponse.credential);
      login(response.data);

      if (response.data.role === "Admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (err: unknown) {
      console.error("Google login error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || "Google ile giriş başarısız.",
        );
      } else {
        setError("Google ile giriş sırasında bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google ile giriş başarısız oldu.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
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
              Hoş Geldiniz
            </h1>
            <p className="text-gray-600">
              Hesabınıza giriş yaparak alışverişe devam edin
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                text="signin_with"
                size="large"
                theme="outline"
                shape="rectangular"
                width="100%"
              />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => alert("Apple Girişi henüz yapılandırılmadı.")}
            >
              <FaApple className="text-xl text-black" />
              Apple ile Giriş Yap
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

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="E-Posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              leftIcon={<FiMail className="w-5 h-5" />}
              required
              disabled={isLoading}
            />

            <Input
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<FiLock className="w-5 h-5" />}
              required
              disabled={isLoading}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600">Beni hatırla</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-gray-900 hover:underline"
              >
                Şifremi Unuttum
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              rightIcon={<FiArrowRight className="w-4 h-4" />}
            >
              Giriş Yap
            </Button>
          </form>

          {/* Register Link */}
          <p className="mt-8 text-center text-gray-600">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="font-semibold text-gray-900 hover:underline"
            >
              Ücretsiz Kayıt Olun
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center p-16">
        <div className="max-w-lg text-center">
          <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <FiShoppingBag className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Binlerce Ürün, Tek Platform
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            En son moda trendlerinden günlük ihtiyaçlarınıza kadar her şey bir
            tık uzağınızda. Güvenli alışveriş, hızlı teslimat.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-sm text-gray-400 mt-1">Ürün</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100K+</div>
              <div className="text-sm text-gray-400 mt-1">Müşteri</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.9</div>
              <div className="text-sm text-gray-400 mt-1">Puan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
