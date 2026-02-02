"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await authApi.login(email, password);

      // Use Context to login
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
        setError(axiosError.response?.data?.message || "Giris basarisiz.");
      } else {
        setError("Beklenmeyen bir hata olustu.");
      }
    }
  };

  // GUVENLIK: ID token ile calisan handler
  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    try {
      setError("");

      if (!credentialResponse.credential) {
        throw new Error("Google credential alinamadi");
      }

      // Backend'e ID token gonder (kriptografik olarak dogrulanacak)
      const response = await authApi.googleLogin(credentialResponse.credential);

      // Context'e login yap
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
          axiosError.response?.data?.message || "Google ile giris basarisiz.",
        );
      } else {
        setError("Google ile giris sirasinda bir hata olustu.");
      }
    }
  };

  const handleGoogleError = () => {
    setError("Google ile giris basarisiz oldu.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Giriş Yap
        </h2>

        {/* Social Login Buttons - GUVENLIK: GoogleLogin component kullaniyor */}
        <div className="mb-6 flex flex-col gap-3">
          {/* Google Login - ID token ile guvenli dogrulama */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              text="signin_with"
              size="large"
              theme="outline"
              shape="rectangular"
            />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            onClick={() =>
              alert("Apple Girisi henuz yapilandirilmadi (API Key gerekli).")
            }
          >
            <FaApple className="text-xl text-black" />
            Apple ile Giris Yap
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              veya e-posta ile
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-2 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              E-Posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Sifremi Unuttum?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            Giris Yap
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
