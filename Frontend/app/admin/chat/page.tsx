import { Metadata } from "next";
import { AdminChatPanel } from "@/components/chat/AdminChatPanel";

export const metadata: Metadata = {
  title: "Canlı Destek Yönetimi | Admin",
  description: "Müşteri destek görüşmelerini yönet",
};

export default function AdminChatPage() {
  return <AdminChatPanel />;
}
