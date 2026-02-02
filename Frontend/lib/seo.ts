import { Metadata, Viewport } from "next";

// Site genelinde kullanılacak sabitler
export const siteConfig = {
  name: "E-Ticaret Mağazası",
  description:
    "Türkiye'nin en güvenilir online alışveriş platformu. Binlerce ürün, uygun fiyatlar ve hızlı teslimat.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  ogImage: "/og-image.jpg",
  keywords: [
    "e-ticaret",
    "online alışveriş",
    "indirim",
    "kampanya",
    "ürün",
    "mağaza",
  ],
  author: "E-Ticaret Mağazası",
  twitterHandle: "@eticaret",
  locale: "tr_TR",
};

// Varsayılan metadata
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: siteConfig.url,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

// Viewport ayarları
export const defaultViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

// Ürün sayfası için metadata oluşturma
export function generateProductMetadata(product: {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  brandName: string;
  stock: number;
  slug?: string;
  id: string;
}): Metadata {
  const url = `${siteConfig.url}/product/${product.id}`;
  const imageUrl = product.imageUrl.startsWith("http")
    ? product.imageUrl
    : `${process.env.NEXT_PUBLIC_API_URL}${product.imageUrl}`;

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    keywords: [
      product.name,
      product.categoryName,
      product.brandName,
      "satın al",
      "online",
    ],
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      title: product.name,
      description: product.description.slice(0, 160),
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description.slice(0, 160),
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Kategori sayfası için metadata oluşturma
export function generateCategoryMetadata(category: {
  name: string;
  description?: string;
  slug: string;
}): Metadata {
  const url = `${siteConfig.url}/products?category=${category.slug}`;
  const description =
    category.description ||
    `${category.name} kategorisindeki tüm ürünleri keşfedin. En uygun fiyatlar ve hızlı teslimat.`;

  return {
    title: `${category.name} Ürünleri`,
    description,
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      title: `${category.name} Ürünleri | ${siteConfig.name}`,
      description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary",
      title: `${category.name} Ürünleri`,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Sayfa başlıkları için yardımcı fonksiyon
export function getPageTitle(title: string): string {
  return `${title} | ${siteConfig.name}`;
}
