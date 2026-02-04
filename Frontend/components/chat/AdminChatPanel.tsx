"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  FaComments,
  FaUser,
  FaRobot,
  FaPaperPlane,
  FaCircle,
  FaCheck,
  FaCheckDouble,
  FaClock,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaStar,
  FaChartBar,
} from "react-icons/fa";

interface ChatRoom {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  guestEmail?: string;
  guestName?: string;
  assignedToId?: string;
  assignedToName?: string;
  status: string;
  priority: string;
  subject?: string;
  category?: string;
  createdAt: string;
  lastMessageAt?: string;
  messageCount: number;
  satisfactionRating?: number;
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
  isRead: boolean;
  createdAt: string;
}

interface ChatStats {
  totalChats: number;
  activeChats: number;
  waitingChats: number;
  resolvedToday: number;
  averageSatisfaction: number;
  onlineAgents: Agent[];
}

interface Agent {
  id: string;
  userId: string;
  userName: string;
  isAvailable: boolean;
  isOnline: boolean;
  activeChats: number;
  maxConcurrentChats: number;
}

export function AdminChatPanel() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load rooms and stats
  useEffect(() => {
    fetchRooms();
    fetchStats();

    const interval = setInterval(() => {
      fetchRooms();
      if (selectedRoom) {
        fetchMessages(selectedRoom.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [filter, selectedRoom]);

  const fetchRooms = async () => {
    try {
      const status = filter === "all" ? undefined : filter;
      const { data } = await api.get("/api/Chat/rooms", { params: { status } });
      setRooms(data);
    } catch (error) {
      console.error("Chatler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/api/Chat/stats");
      setStats(data);
    } catch {
      // Silent fail
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data } = await api.get(`/api/Chat/rooms/${roomId}/messages`);
      setMessages(data);

      // Mark as read
      await api.post(`/api/Chat/rooms/${roomId}/read`);
    } catch {
      // Silent fail
    }
  };

  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    await fetchMessages(room.id);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedRoom) return;

    try {
      setSending(true);
      await api.post("/api/Chat/messages", {
        chatRoomId: selectedRoom.id,
        content: inputMessage,
      });

      setInputMessage("");
      await fetchMessages(selectedRoom.id);
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    } finally {
      setSending(false);
    }
  };

  const assignToMe = async (roomId: string) => {
    try {
      // Get my agent status
      const { data: agent } = await api.get("/api/Chat/agents/me");
      await api.post(`/api/Chat/rooms/${roomId}/assign/${agent.userId}`);
      await fetchRooms();
    } catch (error) {
      console.error("Atama yapılamadı:", error);
    }
  };

  const closeChat = async (roomId: string) => {
    try {
      await api.post(
        `/api/Chat/rooms/${roomId}/close`,
        "Görüşme sonlandırıldı",
      );
      setSelectedRoom(null);
      await fetchRooms();
    } catch (error) {
      console.error("Chat kapatılamadı:", error);
    }
  };

  const updateStatus = async (online: boolean) => {
    try {
      await api.put("/api/Chat/agents/status", {
        isOnline: online,
        isAvailable: online,
      });
      setIsOnline(online);
    } catch {
      // Silent fail
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.userName?.toLowerCase().includes(query) ||
      room.userEmail?.toLowerCase().includes(query) ||
      room.guestName?.toLowerCase().includes(query) ||
      room.guestEmail?.toLowerCase().includes(query) ||
      room.subject?.toLowerCase().includes(query)
    );
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "text-red-500";
      case "High":
        return "text-orange-500";
      case "Normal":
        return "text-gray-500";
      case "Low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting":
        return "bg-yellow-100 text-yellow-700";
      case "Active":
        return "bg-green-100 text-green-700";
      case "OnHold":
        return "bg-orange-100 text-orange-700";
      case "Resolved":
        return "bg-blue-100 text-blue-700";
      case "Closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Canlı Destek</h1>
            <button
              onClick={() => updateStatus(!isOnline)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <FaCircle
                className={`inline w-2 h-2 mr-1 ${isOnline ? "text-green-500" : "text-gray-400"}`}
              />
              {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ara..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="p-4 border-b border-gray-200 grid grid-cols-2 gap-2">
            <StatBadge
              label="Bekleyen"
              value={stats.waitingChats}
              color="yellow"
            />
            <StatBadge label="Aktif" value={stats.activeChats} color="green" />
            <StatBadge
              label="Bugün Çözülen"
              value={stats.resolvedToday}
              color="blue"
            />
            <StatBadge
              label="Memnuniyet"
              value={`${stats.averageSatisfaction.toFixed(1)}⭐`}
              color="purple"
            />
          </div>
        )}

        {/* Filters */}
        <div className="p-2 border-b border-gray-200 flex gap-1 overflow-x-auto">
          {["all", "Waiting", "Active", "OnHold", "Resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === f
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Tümü" : f}
            </button>
          ))}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <FaSpinner className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaComments className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Görüşme bulunamadı</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isSelected={selectedRoom?.id === room.id}
                onClick={() => selectRoom(room)}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedRoom.userName ||
                      selectedRoom.guestName ||
                      "Misafir"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedRoom.userEmail ||
                      selectedRoom.guestEmail ||
                      selectedRoom.subject}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRoom.status)}`}
                >
                  {selectedRoom.status}
                </span>
              </div>

              <div className="flex gap-2">
                {selectedRoom.status === "Waiting" && (
                  <button
                    onClick={() => assignToMe(selectedRoom.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Üstlen
                  </button>
                )}
                {selectedRoom.status !== "Closed" && (
                  <button
                    onClick={() => closeChat(selectedRoom.id)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Kapat
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <AdminMessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedRoom.status !== "Closed" && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Mesaj yazın..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || sending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaPaperPlane />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <FaComments className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Görüşme seçin</p>
              <p className="text-sm">
                Sol panelden bir görüşme seçerek başlayın
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className={`p-2 rounded-lg ${colors[color]}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function ChatRoomItem({
  room,
  isSelected,
  onClick,
  getPriorityColor,
  getStatusColor,
}: {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
  getPriorityColor: (p: string) => string;
  getStatusColor: (s: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-indigo-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <FaUser className="text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900 truncate">
              {room.userName || room.guestName || "Misafir"}
            </p>
            <FaCircle
              className={`w-2 h-2 ${getPriorityColor(room.priority)}`}
            />
          </div>
          <p className="text-sm text-gray-500 truncate">
            {room.lastMessage?.content || room.subject || "Yeni görüşme"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(room.status)}`}
            >
              {room.status}
            </span>
            <span className="text-xs text-gray-400">
              {room.lastMessageAt
                ? new Date(room.lastMessageAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
            {room.unreadCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function AdminMessageBubble({ message }: { message: ChatMessage }) {
  const isAdmin = message.isFromAdmin;

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%]`}>
        {!isAdmin && (
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                message.isFromBot ? "bg-purple-100" : "bg-gray-200"
              }`}
            >
              {message.isFromBot ? (
                <FaRobot className="w-3 h-3 text-purple-600" />
              ) : (
                <FaUser className="w-3 h-3 text-gray-500" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {message.isFromBot ? "Bot" : message.senderName || "Müşteri"}
            </span>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl ${
            isAdmin
              ? "bg-indigo-600 text-white rounded-br-md"
              : message.isFromBot
                ? "bg-purple-100 text-purple-900 rounded-bl-md"
                : "bg-white text-gray-900 rounded-bl-md shadow-sm"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div
          className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isAdmin ? "justify-end" : ""}`}
        >
          <span>
            {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isAdmin &&
            (message.isRead ? (
              <FaCheckDouble className="text-blue-400" />
            ) : (
              <FaCheck />
            ))}
        </div>
      </div>
    </div>
  );
}
