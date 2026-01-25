import Link from "next/link";
import {
  FaBox,
  FaChartLine,
  FaClipboardList,
  FaSignOutAlt,
  FaTag,
} from "react-icons/fa";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-custom-red">Admin Panel</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded text-gray-600 hover:bg-gray-50 hover:text-custom-red transition-colors"
          >
            <FaChartLine /> Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-3 rounded text-gray-600 hover:bg-gray-50 hover:text-custom-red transition-colors"
          >
            <FaBox /> Ürünler
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-4 py-3 rounded text-gray-600 hover:bg-gray-50 hover:text-custom-red transition-colors"
          >
            <FaTag /> Kategoriler
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-4 py-3 rounded text-gray-600 hover:bg-gray-50 hover:text-custom-red transition-colors"
          >
            <FaClipboardList /> Siparişler
          </Link>

          <div className="pt-8 mt-8 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded text-gray-600 hover:bg-gray-50 hover:text-custom-red transition-colors"
            >
              <FaSignOutAlt /> Siteye Dön
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow h-16 flex items-center px-6 md:hidden">
          <div className="font-bold text-lg">Admin Panel</div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
