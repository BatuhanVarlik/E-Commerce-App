"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaComments,
  FaTimes,
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaPaperclip,
  FaSpinner,
  FaChevronDown,
  FaHeadset,
  FaStar,
} from "react-icons/fa";

interface ChatRoom {
  id: string;
  status: string;
  subject?: string;
  category?: string;
  assignedToName?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId?: string;
  senderName?: string;
  isFromAdmin: boolean;
  isFromBot: boolean;
  content: string;
  type: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

interface QuickReply {
  text: string;
}

export function LiveChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load quick replies
  useEffect(() => {
    if (isOpen && quickReplies.length === 0) {
      fetchQuickReplies();
    }
  }, [isOpen]);

  // Poll for new messages
  useEffect(() => {
    if (!activeRoom) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(
          `/api/Chat/rooms/${activeRoom.id}/messages`,
        );
        setMessages(data);

        // Check unread
        const { data: unread } = await api.get(
          `/api/Chat/rooms/${activeRoom.id}/unread`,
        );
        setUnreadCount(unread);

        // Check if closed
        const { data: room } = await api.get(
          `/api/Chat/rooms/${activeRoom.id}`,
        );
        if (room.status === "Closed" && !showRating) {
          setShowRating(true);
        }
      } catch {
        // Silent fail
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRoom, showRating]);

  const fetchQuickReplies = async () => {
    try {
      const { data } = await api.get("/api/Chat/bot/quick-replies");
      setQuickReplies(data);
    } catch {
      setQuickReplies([
        "Siparişim nerede?",
        "İade yapmak istiyorum",
        "Ödeme sorunu yaşıyorum",
        "Yetkiliyle görüşmek istiyorum",
      ]);
    }
  };

  const startNewChat = async (initialMessage?: string) => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/Chat/rooms", {
        subject: "Destek Talebi",
        category: "General",
        initialMessage,
      });
      setActiveRoom(data);

      // Load messages
      const { data: msgs } = await api.get(
        `/api/Chat/rooms/${data.id}/messages`,
      );
      setMessages(msgs);
    } catch (error) {
      console.error("Chat başlatılamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || !activeRoom) return;

    try {
      setSending(true);
      setInputMessage("");

      const { data: newMessage } = await api.post("/api/Chat/messages", {
        chatRoomId: activeRoom.id,
        content: messageContent,
      });

      setMessages((prev) => [...prev, newMessage]);

      // Check for bot response
      const { data: botResponse } = await api.post("/api/Chat/bot/query", {
        message: messageContent,
        chatRoomId: activeRoom.id,
      });

      if (botResponse.found && botResponse.answer) {
        // Add bot response
        setTimeout(() => {
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}`,
            chatRoomId: activeRoom.id,
            isFromAdmin: false,
            isFromBot: true,
            content: botResponse.answer,
            type: "BotResponse",
            isRead: true,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botMessage]);

          // Update quick replies if available
          if (botResponse.quickReplies) {
            setQuickReplies(botResponse.quickReplies);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!activeRoom) {
      startNewChat(reply);
    } else {
      sendMessage(reply);
    }
  };

  const handleRating = async (rating: number) => {
    if (!activeRoom) return;

    try {
      await api.post(`/api/Chat/rooms/${activeRoom.id}/rate`, rating);
      setShowRating(false);
      setActiveRoom(null);
      setMessages([]);
    } catch {
      // Silent fail
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${isOpen ? "scale-0" : "scale-100"}`}
      >
        <FaComments className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all transform origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaHeadset className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Canlı Destek</h3>
              <p className="text-xs text-white/80">
                {activeRoom?.assignedToName ||
                  "Size yardımcı olmaktan mutluluk duyarız"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Modal */}
        {showRating && (
          <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center p-6 z-10">
            <FaStar className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Görüşmeyi Değerlendir
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Destek deneyiminizi nasıl buldunuz?
            </p>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                >
                  <FaStar
                    className={`w-8 h-8 ${star <= 3 ? "text-gray-300 hover:text-yellow-400" : "text-yellow-400"}`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowRating(false);
                setActiveRoom(null);
                setMessages([]);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Atla
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <FaRobot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Merhaba! Size nasıl yardımcı olabilirim?
              </p>
              <div className="space-y-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="block w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies (when chat active) */}
        {activeRoom && quickReplies.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {quickReplies.slice(0, 3).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="flex-shrink-0 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={!activeRoom && !inputMessage}
            />
            <button
              onClick={() =>
                activeRoom ? sendMessage() : startNewChat(inputMessage)
              }
              disabled={!inputMessage.trim() || sending}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <FaSpinner className="w-5 h-5 animate-spin" />
              ) : (
                <FaPaperPlane className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isOwn = !message.isFromAdmin && !message.isFromBot;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isOwn ? "order-1" : ""}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${message.isFromBot ? "bg-purple-100" : "bg-green-100"}`}
            >
              {message.isFromBot ? (
                <FaRobot className="w-3 h-3 text-purple-600" />
              ) : (
                <FaUser className="w-3 h-3 text-green-600" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {message.isFromBot ? "Asistan" : message.senderName || "Destek"}
            </span>
          </div>
        )}

        {/* Message */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-md"
              : message.isFromBot
                ? "bg-purple-100 text-purple-900 rounded-bl-md"
                : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Attachment */}
          {message.attachmentUrl && (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 mt-2 text-xs ${isOwn ? "text-white/80" : "text-gray-600"}`}
            >
              <FaPaperclip className="w-3 h-3" />
              {message.attachmentName || "Dosya"}
            </a>
          )}
        </div>

        {/* Time */}
        <p
          className={`text-xs text-gray-400 mt-1 ${isOwn ? "text-right" : ""}`}
        >
          {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
