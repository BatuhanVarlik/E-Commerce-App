import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useViewTracking(productId: string | null) {
  const { user } = useAuth();

  useEffect(() => {
    if (!productId) return;

    const trackView = async () => {
      try {
        // Get or create session ID
        let sessionId = localStorage.getItem("sessionId");
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("sessionId", sessionId);
        }

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/Recommendations/track-view`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            },
            body: JSON.stringify({
              productId,
              sessionId: user ? undefined : sessionId,
            }),
          },
        );
      } catch (error) {
        console.error("Failed to track product view:", error);
      }
    };

    // Track after 2 seconds to avoid tracking quick page switches
    const timer = setTimeout(trackView, 2000);

    return () => clearTimeout(timer);
  }, [productId, user]);
}
