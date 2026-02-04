import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { defaultMetadata, defaultViewport } from "@/lib/seo";
import {
  JsonLd,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/schema";
import { MobileHeader, MobileBottomNav } from "@/components/mobile";
import { LiveChatWidget } from "@/components/chat/LiveChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = defaultViewport;

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
      <head>
        <JsonLd data={generateOrganizationSchema()} />
        <JsonLd data={generateWebSiteSchema()} />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {/* Desktop Navigation */}
                <div className="hidden lg:block">
                  <Navbar />
                </div>

                {/* Mobile Navigation */}
                <MobileHeader />

                {/* Main Content */}
                <main className="lg:pt-0 pb-20 lg:pb-0">{children}</main>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav />

                {/* Live Chat Widget - Tüm sayfalarda görünür */}
                <LiveChatWidget />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
