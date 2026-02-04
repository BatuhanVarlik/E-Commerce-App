"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaTelegram,
  FaLinkedin,
  FaPinterest,
  FaEnvelope,
  FaLink,
  FaCheck,
} from "react-icons/fa";

interface SocialShareProps {
  productId: string;
  productName: string;
  productUrl: string;
  productImage?: string;
  productPrice: number;
}

interface ShareLinks {
  facebookShareUrl: string;
  twitterShareUrl: string;
  whatsAppShareUrl: string;
  telegramShareUrl: string;
  linkedInShareUrl: string;
  pinterestShareUrl: string;
  emailShareUrl: string;
}

export function SocialShareButtons({
  productId,
  productName,
  productUrl,
  productImage,
  productPrice,
}: SocialShareProps) {
  const [shareLinks, setShareLinks] = useState<ShareLinks | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchShareLinks = async () => {
      try {
        const { data } = await api.get(
          `/api/Social/share/product/${productId}`,
        );
        setShareLinks(data);
      } catch {
        // Fallback links oluştur
        const encodedUrl = encodeURIComponent(productUrl);
        const encodedTitle = encodeURIComponent(productName);
        const encodedDescription = encodeURIComponent(
          `${productName} - ${productPrice.toFixed(2)} ₺`,
        );

        setShareLinks({
          facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          twitterShareUrl: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          whatsAppShareUrl: `https://wa.me/?text=${encodedDescription}%20${encodedUrl}`,
          telegramShareUrl: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
          linkedInShareUrl: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
          pinterestShareUrl: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
          emailShareUrl: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
        });
      }
    };

    fetchShareLinks();
  }, [productId, productName, productUrl, productPrice]);

  const trackShare = async (platform: string) => {
    try {
      await api.post("/api/Social/share/track", { productId, platform });
    } catch {
      // Tracking hatası kullanıcıyı etkilemesin
    }
  };

  const handleShare = (platform: string, url: string) => {
    trackShare(platform);
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      trackShare("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API desteklenmiyorsa
      const textArea = document.createElement("textarea");
      textArea.value = productUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!shareLinks) return null;

  const shareButtons = [
    {
      name: "Facebook",
      icon: FaFacebook,
      url: shareLinks.facebookShareUrl,
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      url: shareLinks.twitterShareUrl,
      color: "bg-[#1DA1F2] hover:bg-[#1A94DA]",
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: shareLinks.whatsAppShareUrl,
      color: "bg-[#25D366] hover:bg-[#22C35E]",
    },
    {
      name: "Telegram",
      icon: FaTelegram,
      url: shareLinks.telegramShareUrl,
      color: "bg-[#0088CC] hover:bg-[#007BB5]",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      url: shareLinks.linkedInShareUrl,
      color: "bg-[#0A66C2] hover:bg-[#095BB5]",
    },
    {
      name: "Pinterest",
      icon: FaPinterest,
      url: shareLinks.pinterestShareUrl,
      color: "bg-[#E60023] hover:bg-[#D0001F]",
    },
    {
      name: "Email",
      icon: FaEnvelope,
      url: shareLinks.emailShareUrl,
      color: "bg-gray-600 hover:bg-gray-700",
      isEmail: true,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-700">Bu ürünü paylaş:</p>
      <div className="flex flex-wrap gap-2">
        {shareButtons.map((btn) => (
          <button
            key={btn.name}
            onClick={() =>
              btn.isEmail
                ? (window.location.href = btn.url)
                : handleShare(btn.name.toLowerCase(), btn.url)
            }
            className={`${btn.color} p-2 rounded-full text-white transition-colors touch-manipulation`}
            title={btn.name}
            aria-label={`${btn.name}'da paylaş`}
          >
            <btn.icon className="w-4 h-4" />
          </button>
        ))}

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className={`p-2 rounded-full transition-colors touch-manipulation ${
            copied
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title="Linki kopyala"
          aria-label="Linki kopyala"
        >
          {copied ? (
            <FaCheck className="w-4 h-4" />
          ) : (
            <FaLink className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// Compact version for product cards
export function SocialShareCompact({
  productId,
  productUrl,
}: {
  productId: string;
  productUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(productUrl)}`,
      "_blank",
    );
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={handleWhatsApp}
        className="p-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#22C35E] transition-colors"
        title="WhatsApp'ta paylaş"
      >
        <FaWhatsapp className="w-3 h-3" />
      </button>
      <button
        onClick={handleCopyLink}
        className={`p-1.5 rounded-full transition-colors ${
          copied
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
        }`}
        title="Linki kopyala"
      >
        {copied ? (
          <FaCheck className="w-3 h-3" />
        ) : (
          <FaLink className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}
