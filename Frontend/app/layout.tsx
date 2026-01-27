import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Ticaret Projesi",
  description: "En iyi ürünler burada.",
};

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="tr">
      <body className={inter.className} suppressHydrationWarning={true}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Navbar />
                {children}
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
