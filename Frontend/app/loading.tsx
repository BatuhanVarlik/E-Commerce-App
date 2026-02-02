export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Yükleniyor...</p>
      </div>
    </div>
  );
}
