"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { api } from "@/lib/api";
import Image from "next/image";

interface ReviewCardProps {
  review: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    imageUrl?: string;
    helpfulCount: number;
    notHelpfulCount: number;
    createdAt: string;
  };
  onVote?: () => void;
}

export default function ReviewCard({ review, onVote }: ReviewCardProps) {
  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState<boolean | null>(null);

  const handleVote = async (isHelpful: boolean) => {
    if (voting) return;

    setVoting(true);
    try {
      await api.post(`/api/Reviews/${review.id}/vote`, {
        isHelpful,
      });
      setUserVote(isHelpful);
      if (onVote) onVote();
    } catch (err) {
      console.error("Oylama hatası:", err);
    } finally {
      setVoting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-custom-red rounded-full flex items-center justify-center text-white font-bold">
              {review.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{review.userName}</p>
              <p className="text-xs text-gray-500">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>
          <StarRating rating={review.rating} readonly size="sm" />
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

      {review.imageUrl &&
        typeof review.imageUrl === "string" &&
        review.imageUrl.trim().length > 0 &&
        review.imageUrl !== "string" &&
        !review.imageUrl.startsWith("string") && (
          <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden">
            <Image
              src={
                review.imageUrl.startsWith("http")
                  ? review.imageUrl
                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5162"}${review.imageUrl}`
              }
              alt="Review image"
              fill
              className="object-cover"
            />
          </div>
        )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-600">Bu yorum yararlı mı?</span>
        <button
          onClick={() => handleVote(true)}
          disabled={voting || userVote === true}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
            userVote === true
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          } disabled:opacity-50`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          Evet ({review.helpfulCount})
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={voting || userVote === false}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
            userVote === false
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          } disabled:opacity-50`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
          Hayır ({review.notHelpfulCount})
        </button>
      </div>
    </div>
  );
}
