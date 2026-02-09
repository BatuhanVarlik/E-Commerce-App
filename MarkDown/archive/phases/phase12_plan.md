# Phase 12: Kullanıcı Profil ve Hesap Yönetimi - Implementation Plan

## 🎯 Amaç

Kullanıcıların hesaplarını yönetebilmeleri, sipariş geçmişini görüntüleyebilmeleri, adres defterini düzenleyebilmeleri ve profil bilgilerini güncelleyebilmeleri için kapsamlı bir profil yönetim sistemi oluşturmak.

## 📋 Özellikler Özeti

### 1. Profil Yönetimi 🔴

**Öncelik**: Yüksek

**Özellikler**:

- Ad, soyad, email, telefon düzenleme
- Şifre değiştirme
- Profil fotoğrafı yükleme
- Hesap silme (soft delete)
- Email doğrulama (verification)

### 2. Adres Defteri 🔴

**Öncelik**: Yüksek

**Özellikler**:

- Birden fazla adres kaydetme
- Varsayılan fatura/teslimat adresi seçimi
- Adres CRUD operasyonları
- İl/İlçe/Mahalle hiyerarşisi
- Adres doğrulama

### 3. Sipariş Geçmişi 🔴

**Öncelik**: Yüksek

**Özellikler**:

- Tüm siparişleri listeleme
- Sipariş detayı görüntüleme
- Sipariş durumu takibi (Hazırlanıyor, Kargoda, Teslim Edildi)
- Fatura indirme (PDF)
- Sipariş iptali
- Tekrar satın alma (Re-order)

### 4. Favori Ürünler (Wishlist Integration) 🟡

**Öncelik**: Orta

**Özellikler**:

- Wishlist'ten sepete ekleme
- Fiyat değişikliği bildirimleri
- Ürün karşılaştırma

### 5. Hesap Ayarları 🟢

**Öncelik**: Düşük

**Özellikler**:

- Email bildirimleri ayarları
- SMS bildirimleri
- Gizlilik ayarları
- İki faktörlü kimlik doğrulama (2FA)

---

## 🛠️ Teknik Gereksinimler

### Backend Stack

```
- .NET 8.0 Web API
- Entity Framework Core 8.0
- PostgreSQL 16
- ASP.NET Identity
- AutoMapper (DTO mapping)
- FluentValidation (Input validation)
```

### Frontend Stack

```
- Next.js 16.1.1
- React 19.0.0
- TypeScript 5.x
- Tailwind CSS v4
- React Hook Form (Form validation)
- React Query / SWR (Data fetching)
```

---

## 💻 Backend Geliştirme

### 1. Address Entity

```csharp
// Entities/Address.cs
public class Address : BaseEntity
{
    public string UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;  // "Ev", "İş"
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string BuildingNo { get; set; } = string.Empty;
    public string ApartmentNo { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
    public AddressType Type { get; set; }  // Billing, Shipping, Both
}

public enum AddressType
{
    Billing,    // Fatura adresi
    Shipping,   // Teslimat adresi
    Both        // Her ikisi
}
```

### 2. Order Entity Enhancement

```csharp
// Entities/Order.cs (Mevcut entity'ye eklemeler)
public class Order : BaseEntity
{
    public string UserId { get; set; }
    public User User { get; set; } = null!;

    public string OrderNumber { get; set; } = string.Empty;  // ORD-2024-00001
    public OrderStatus Status { get; set; }

    // Address snapshots (siparişte kullanılan adreslerin kopyaları)
    public Guid? ShippingAddressId { get; set; }
    public Address? ShippingAddress { get; set; }

    public Guid? BillingAddressId { get; set; }
    public Address? BillingAddress { get; set; }

    // Order details
    public List<OrderItem> Items { get; set; } = new();

    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // Payment info
    public string? PaymentMethod { get; set; }
    public string? TransactionId { get; set; }
    public DateTime? PaidAt { get; set; }

    // Tracking
    public string? CargoCompany { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    // Cancellation
    public bool IsCancelled { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public enum OrderStatus
{
    Pending,         // Beklemede
    PaymentFailed,   // Ödeme başarısız
    Confirmed,       // Onaylandı
    Processing,      // Hazırlanıyor
    Shipped,         // Kargoya verildi
    Delivered,       // Teslim edildi
    Cancelled,       // İptal edildi
    Refunded         // İade edildi
}
```

### 3. UserProfile Service

```csharp
// Interfaces/IUserProfileService.cs
public interface IUserProfileService
{
    // Profile management
    Task<UserProfileDto> GetUserProfileAsync(string userId);
    Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateProfileDto dto);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto);
    Task<bool> UploadProfilePhotoAsync(string userId, IFormFile photo);
    Task<bool> DeleteAccountAsync(string userId, string password);

    // Address management
    Task<List<AddressDto>> GetUserAddressesAsync(string userId);
    Task<AddressDto> GetAddressAsync(string userId, Guid addressId);
    Task<AddressDto> CreateAddressAsync(string userId, CreateAddressDto dto);
    Task<AddressDto> UpdateAddressAsync(string userId, Guid addressId, UpdateAddressDto dto);
    Task<bool> DeleteAddressAsync(string userId, Guid addressId);
    Task<bool> SetDefaultAddressAsync(string userId, Guid addressId);
}

// Services/UserProfileService.cs
public class UserProfileService : IUserProfileService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<UserProfileService> _logger;

    public async Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("Kullanıcı bulunamadı");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.PhoneNumber = dto.PhoneNumber;

        if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
        {
            // Email değiştirme - verification gerektirir
            user.Email = dto.Email;
            user.EmailConfirmed = false;
            // Send verification email
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new Exception("Profil güncellenemedi");

        return MapToDto(user);
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("Kullanıcı bulunamadı");

        var result = await _userManager.ChangePasswordAsync(
            user,
            dto.CurrentPassword,
            dto.NewPassword
        );

        return result.Succeeded;
    }

    public async Task<AddressDto> CreateAddressAsync(string userId, CreateAddressDto dto)
    {
        // Eğer isDefault true ise, diğer adreslerin isDefault'unu false yap
        if (dto.IsDefault)
        {
            var userAddresses = await _context.Addresses
                .Where(a => a.UserId == userId)
                .ToListAsync();

            foreach (var addr in userAddresses)
            {
                addr.IsDefault = false;
            }
        }

        var address = new Address
        {
            UserId = userId,
            Title = dto.Title,
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            City = dto.City,
            District = dto.District,
            Neighborhood = dto.Neighborhood,
            Street = dto.Street,
            BuildingNo = dto.BuildingNo,
            ApartmentNo = dto.ApartmentNo,
            PostalCode = dto.PostalCode,
            IsDefault = dto.IsDefault,
            Type = dto.Type
        };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();

        return MapToDto(address);
    }
}
```

### 4. Order Service Enhancement

```csharp
// Interfaces/IOrderService.cs (Enhancement)
public interface IOrderService
{
    // Existing methods...

    // User order history
    Task<PaginatedResult<OrderDto>> GetUserOrdersAsync(string userId, int page, int pageSize);
    Task<OrderDetailDto> GetOrderDetailAsync(string userId, Guid orderId);
    Task<bool> CancelOrderAsync(string userId, Guid orderId, string reason);
    Task<byte[]> GenerateInvoicePdfAsync(Guid orderId);
    Task<OrderDto> ReorderAsync(string userId, Guid orderId);
}

// Services/OrderService.cs
public class OrderService : IOrderService
{
    public async Task<PaginatedResult<OrderDto>> GetUserOrdersAsync(
        string userId,
        int page = 1,
        int pageSize = 10)
    {
        var query = _context.Orders
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();

        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<OrderDto>
        {
            Items = orders.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize)
        };
    }

    public async Task<bool> CancelOrderAsync(string userId, Guid orderId, string reason)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            throw new NotFoundException("Sipariş bulunamadı");

        // Sadece belirli durumlarda iptal edilebilir
        if (order.Status != OrderStatus.Pending &&
            order.Status != OrderStatus.Confirmed &&
            order.Status != OrderStatus.Processing)
        {
            throw new InvalidOperationException("Bu sipariş iptal edilemez");
        }

        order.IsCancelled = true;
        order.CancellationReason = reason;
        order.CancelledAt = DateTime.UtcNow;
        order.Status = OrderStatus.Cancelled;

        // Stokları geri yükle
        foreach (var item in order.Items)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Stock += item.Quantity;
            }
        }

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<OrderDto> ReorderAsync(string userId, Guid orderId)
    {
        var originalOrder = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (originalOrder == null)
            throw new NotFoundException("Sipariş bulunamadı");

        // Stok kontrolü
        foreach (var item in originalOrder.Items)
        {
            if (item.Product.Stock < item.Quantity)
            {
                throw new InvalidOperationException(
                    $"{item.Product.Name} ürünü için yeterli stok yok"
                );
            }
        }

        // Yeni sipariş oluştur (aynı ürünlerle)
        var newOrder = new Order
        {
            UserId = userId,
            OrderNumber = GenerateOrderNumber(),
            Status = OrderStatus.Pending,
            Items = originalOrder.Items.Select(oi => new OrderItem
            {
                ProductId = oi.ProductId,
                Quantity = oi.Quantity,
                UnitPrice = oi.Product.Price,  // Güncel fiyat
                TotalPrice = oi.Product.Price * oi.Quantity
            }).ToList()
        };

        // Toplamları hesapla
        newOrder.Subtotal = newOrder.Items.Sum(i => i.TotalPrice);
        newOrder.TotalAmount = newOrder.Subtotal;

        _context.Orders.Add(newOrder);
        await _context.SaveChangesAsync();

        return MapToDto(newOrder);
    }
}
```

### 5. DTOs

```csharp
// DTOs/UserProfile/UserProfileDto.cs
public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfilePhotoUrl { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

// DTOs/Address/AddressDto.cs
public class AddressDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string BuildingNo { get; set; } = string.Empty;
    public string ApartmentNo { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public AddressType Type { get; set; }
    public string FormattedAddress => $"{Street} {BuildingNo}/{ApartmentNo}, {Neighborhood}, {District}/{City}";
}

public class CreateAddressDto
{
    public string Title { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string BuildingNo { get; set; } = string.Empty;
    public string ApartmentNo { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public AddressType Type { get; set; }
}

// DTOs/Order/OrderDto.cs
public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
}

public class OrderDetailDto : OrderDto
{
    public List<OrderItemDto> Items { get; set; } = new();
    public AddressDto? ShippingAddress { get; set; }
    public AddressDto? BillingAddress { get; set; }

    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal DiscountAmount { get; set; }

    public string? PaymentMethod { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    public bool IsCancelled { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductImageUrl { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}
```

---

## 🎨 Frontend Geliştirme

### 1. Profile Page Layout

```tsx
// app/profile/layout.tsx
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <ProfileSidebar />
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}

// components/ProfileSidebar.tsx
export default function ProfileSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/profile", icon: FaUser, label: "Hesap Bilgilerim" },
    { href: "/profile/orders", icon: FaShoppingBag, label: "Siparişlerim" },
    { href: "/profile/addresses", icon: FaMapMarkerAlt, label: "Adreslerim" },
    { href: "/profile/wishlist", icon: FaHeart, label: "Favorilerim" },
    { href: "/profile/settings", icon: FaCog, label: "Ayarlar" },
  ];

  return (
    <nav className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3 pb-4 border-b mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          <FaUser className="text-gray-600" />
        </div>
        <div>
          <p className="font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-custom-orange text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={logout}
        className="w-full mt-4 flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <FaSignOutAlt />
        <span>Çıkış Yap</span>
      </button>
    </nav>
  );
}
```

### 2. Profile Information Page

```tsx
// app/profile/page.tsx
export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profil güncellendi");
    } catch (error) {
      toast.error("Profil güncellenemedi");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hesap Bilgilerim</h1>

      {/* Profile Photo */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user?.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="text-4xl text-gray-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-custom-orange text-white p-2 rounded-full hover:bg-orange-600">
              <FaCamera />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Kişisel Bilgiler</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-custom-orange hover:underline"
          >
            {isEditing ? "İptal" : "Düzenle"}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ad</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Soyad</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              className="mt-6 bg-custom-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Kaydet
            </button>
          )}
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Şifre Değiştir</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
```

### 3. Orders Page

```tsx
// app/profile/orders/page.tsx
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/api/Orders/user?page=${page}&pageSize=10`);
      setOrders(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Siparişler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            Henüz siparişiniz bulunmamaktadır
          </p>
          <Link
            href="/products"
            className="inline-block bg-custom-orange text-white px-6 py-2 rounded-lg"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded ${
                    p === page
                      ? "bg-custom-orange text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// components/OrderCard.tsx
export default function OrderCard({ order }: { order: Order }) {
  const getStatusColor = (status: string) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Confirmed: "bg-blue-100 text-blue-800",
      Processing: "bg-indigo-100 text-indigo-800",
      Shipped: "bg-purple-100 text-purple-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">Sipariş No</p>
          <p className="font-semibold">{order.orderNumber}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}
        >
          {order.statusText}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Sipariş Tarihi</p>
          <p>{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Toplam Tutar</p>
          <p className="font-bold text-lg">{order.totalAmount.toFixed(2)}₺</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Ürün Sayısı</p>
          <p>{order.itemCount} adet</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Link
          href={`/profile/orders/${order.id}`}
          className="flex-1 text-center bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200"
        >
          Detay Görüntüle
        </Link>
        {order.status === "Pending" && (
          <button
            onClick={() => handleCancelOrder(order.id)}
            className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200"
          >
            İptal Et
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4. Addresses Page

```tsx
// app/profile/addresses/page.tsx
export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const res = await api.get("/api/UserProfile/addresses");
    setAddresses(res.data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;

    await api.delete(`/api/UserProfile/addresses/${id}`);
    fetchAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Adreslerim</h1>
        <button
          onClick={() => {
            setEditingAddress(null);
            setShowModal(true);
          }}
          className="bg-custom-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          + Yeni Adres Ekle
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FaMapMarkerAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            Kayıtlı adresiniz bulunmamaktadır
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => {
                setEditingAddress(address);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(address.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddressModal
          address={editingAddress}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchAddresses();
          }}
        />
      )}
    </div>
  );
}
```

---

## 🧪 Test Senaryoları

### Backend Tests

```
✅ Profil güncelleme başarılı
✅ Şifre değiştirme doğru şifre ile başarılı
✅ Yanlış mevcut şifre ile şifre değiştirme başarısız
✅ Adres ekleme başarılı
✅ Varsayılan adres değiştirme diğer adresleri günceller
✅ Sipariş iptali stokları geri yükler
✅ Sipariş detayı sadece sipariş sahibine görünür
```

### Frontend Tests

```
✅ Profil bilgileri düzenleme modu açılır/kapanır
✅ Form validation çalışır
✅ Sipariş listesi pagination çalışır
✅ Adres modal açılır/kapanır
✅ Varsayılan adres işaretlenir
```

---

## 📊 Metrikler

- Backend LOC: ~800 satır
- Frontend LOC: ~1200 satır
- API Endpoints: 15+
- Pages: 5 (profile, orders, order-detail, addresses, settings)
- Components: 10+

---

## 🎯 Başarı Kriterleri

1. ✅ Kullanıcı profil bilgilerini güncelleyebilir
2. ✅ Şifre değiştirebilir
3. ✅ Birden fazla adres kaydedebilir
4. ✅ Varsayılan adres seçebilir
5. ✅ Tüm siparişlerini görebilir
6. ✅ Sipariş detaylarını görüntüleyebilir
7. ✅ Bekleyen siparişleri iptal edebilir
8. ✅ Geçmiş siparişi tekrar verebilir
9. ✅ Responsive tasarım (mobile uyumlu)
10. ✅ Loading states ve error handling

---

## 🚀 Timeline

- **Gün 1-2**: Backend (Entities, Services, Controllers)
- **Gün 3-4**: Frontend (Profile, Orders pages)
- **Gün 5**: Addresses, Settings pages
- **Gün 6**: Testing & Bug fixes
- **Gün 7**: Polish & Documentation

**Toplam**: 7 gün

---

## 📝 Notlar

- Profile photo upload için Cloudinary veya AWS S3 entegrasyonu
- PDF invoice generation için iTextSharp veya QuestPDF
- Email verification için SendGrid veya SMTP
- 2FA için Google Authenticator / SMS

Phase 12 tamamlandığında kullanıcılar tam fonksiyonel hesap yönetimi yapabilecek! 🎉
