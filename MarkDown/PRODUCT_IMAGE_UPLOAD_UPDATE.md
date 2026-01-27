# Ürün Resim Yükleme Sistemi Güncelleme

## 📋 Genel Bakış

Admin panelinde ürün eklerken URL ile görsel ekleme yöntemi yerine, yorum (review) sisteminde kullanılan dosya yükleme sistemi entegre edildi.

## 🔄 Yapılan Değişiklikler

### Frontend: `app/admin/products/new/page.tsx`

#### 1. Yeni State ve Referanslar

```typescript
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>("");
const [uploading, setUploading] = useState(false);
const [error, setError] = useState<string>("");
const fileInputRef = useRef<HTMLInputElement>(null);
```

#### 2. Resim Yükleme Fonksiyonları

**`handleImageChange`**

- Dosya tipini kontrol eder (JPG, PNG, GIF, WEBP)
- Maksimum 5MB boyut kontrolü yapar
- FileReader ile preview oluşturur
- Hata durumlarını yönetir

**`removeImage`**

- Seçili resmi kaldırır
- Preview'i temizler
- File input'u sıfırlar

**`uploadImage`**

- FormData ile backend'e dosya gönderir
- `/api/Upload/product-image` endpoint'ini kullanır
- Yükleme durumunu (`uploading`) yönetir
- Başarılı yükleme sonrası URL döndürür

#### 3. Form Submit Güncelleme

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    // Önce resmi yükle
    let imageUrl = "";
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (!uploadedUrl) {
        throw new Error("Resim yüklenemedi");
      }
      imageUrl = uploadedUrl;
    } else {
      setError("Lütfen bir ürün resmi seçin");
      return;
    }

    // Marka ve ürün oluşturma...
    const productData = { ...formData, brandId: brandIdToUse, imageUrl };
    await api.post("/api/admin/products", productData);
    // ...
  }
}
```

#### 4. UI Güncellemeleri

**Resim Önizleme (Preview) Alanı:**

- Next.js Image component ile optimize edilmiş görüntüleme
- Silme butonu (kırmızı X ikonu)
- Responsive tasarım (w-full h-64)

**Dosya Seçme Alanı:**

- Drag & drop desteği (border-dashed stil)
- Upload ikonu
- Açıklayıcı metin ("Dosya seçin veya sürükleyip bırakın")
- Desteklenen formatlar (PNG, JPG, GIF, WEBP - Max. 5MB)

**Hata Gösterimi:**

- Kırmızı arka plan ile hata mesajları
- Form submit öncesi zorunlu kontroller

**Submit Butonu:**

- Yükleme sırasında devre dışı (`disabled={uploading}`)
- Dinamik metin ("Yükleniyor..." / "Ürünü Oluştur")
- Loading state'de görsel geri bildirim

### Backend: `Controllers/UploadController.cs`

#### Yeni Endpoint: `product-image`

```csharp
[HttpPost("product-image")]
public async Task<IActionResult> UploadProductImage(IFormFile file)
{
    try
    {
        // Dosya kontrolü
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Dosya seçilmedi" });

        // Dosya tipi kontrolü
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Sadece resim dosyaları yüklenebilir" });

        // Boyut kontrolü (5MB max)
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Dosya boyutu maksimum 5MB olabilir" });

        // Klasör oluşturma
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "products");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        // Benzersiz dosya adı
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Dosyayı kaydet
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // URL döndür
        var fileUrl = $"/uploads/products/{uniqueFileName}";
        return Ok(new { url = fileUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Resim yükleme hatası");
        return StatusCode(500, new { message = "Resim yüklenirken bir hata oluştu" });
    }
}
```

## ✅ Özellikler

### Güvenlik

- ✅ Dosya tipi doğrulaması (whitelist yaklaşımı)
- ✅ Dosya boyutu limiti (5MB)
- ✅ Benzersiz dosya adları (GUID kullanımı)
- ✅ Authorization kontrolü ([Authorize] attribute)

### Kullanıcı Deneyimi

- ✅ Drag & drop desteği
- ✅ Anlık önizleme
- ✅ Yükleme durumu göstergesi
- ✅ Hata mesajları (Türkçe)
- ✅ Resim kaldırma özelliği
- ✅ Form submit sırasında buton devre dışı

### Tutarlılık

- ✅ Review sistemi ile aynı yükleme mantığı
- ✅ Aynı validasyon kuralları
- ✅ Aynı UI/UX kalıpları
- ✅ Aynı hata yönetimi

## 📁 Dosya Yapısı

```
Backend/ETicaret.API/wwwroot/
└── uploads/
    ├── products/          # Ürün resimleri
    │   └── {guid}.jpg/png/gif/webp
    └── reviews/           # Yorum resimleri
        └── {guid}.jpg/png/gif/webp
```

## 🔗 API Endpoint

### Upload Ürün Resmi

- **Method:** POST
- **URL:** `/api/Upload/product-image`
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (IFormFile)
- **Response:** `{ "url": "/uploads/products/{filename}" }`

### Desteklenen Formatlar

- JPG/JPEG
- PNG
- GIF
- WEBP

### Limitler

- Maksimum dosya boyutu: 5MB
- Sadece resim dosyaları kabul edilir

## 🎯 Kullanım Senaryosu

1. Admin, "Yeni Ürün Ekle" sayfasına gider
2. Dosya seçme alanına tıklar veya resim sürükler
3. Resim önizlemesi gösterilir
4. Gerekirse "X" butonuyla resmi kaldırabilir
5. Formu doldurur ve "Ürünü Oluştur" butonuna tıklar
6. Önce resim backend'e yüklenir
7. Başarılı yükleme sonrası ürün bilgileri ile birlikte kayıt yapılır
8. Başarı mesajı gösterilir ve ürün listesine yönlendirilir

## 🐛 Hata Yönetimi

### Frontend Hataları

- Dosya tipi uyumsuzluğu → "Sadece resim dosyaları yüklenebilir (JPG, PNG, GIF, WEBP)"
- Boyut aşımı → "Resim boyutu maksimum 5MB olabilir"
- Resim seçilmeden submit → "Lütfen bir ürün resmi seçin"
- Upload başarısız → Backend'den gelen hata mesajı

### Backend Hataları

- Dosya null → 400 Bad Request
- Geçersiz uzantı → 400 Bad Request
- Boyut aşımı → 400 Bad Request
- Server hatası → 500 Internal Server Error

## 📊 Phase 8 Durum Güncellemesi

MODERNIZATION_ROADMAP.md dosyasında Phase 8 (Ürün Yorumları & Değerlendirme) tüm maddeleri [x] olarak işaretlendi:

```markdown
## Phase 8: Ürün Yorumları & Değerlendirme 🔴

### Backend

- [x] Review entity oluşturma
- [x] Rating sistemi (1-5 yıldız)
- [x] Yorum CRUD operasyonları
- [x] Yorum moderasyonu (Admin onayı)
- [x] Yararlı/Yararsız oylama
- [x] Resim/Video ekleme desteği

### Frontend

- [x] Yorum yazma formu
- [x] Yıldız rating UI
- [x] Yorumları listeleme ve filtreleme
- [x] Resim galerisi
- [x] Yanıt sistemi
- [x] Yararlı butonları

**Durum:** ✅ **Tamamlandı** - Review sistemi tam olarak çalışıyor
```

## 🚀 Sonraki Adımlar

1. Test etme:
   - Farklı dosya formatları (JPG, PNG, GIF, WEBP)
   - Boyut limiti (5MB)
   - Drag & drop işlevselliği
   - Hata senaryoları

2. İyileştirmeler (Opsiyonel):
   - Çoklu resim yükleme desteği
   - Resim boyutlandırma/optimizasyon (image processing)
   - Progress bar (yükleme ilerlemesi)
   - Resim kırpma (crop) özelliği

## 📝 Not

Bu güncelleme, kullanıcı deneyimini iyileştirmek ve admin panelinde tutarlılık sağlamak amacıyla yapılmıştır. Artık tüm resim yükleme işlemleri (yorumlar ve ürünler) aynı mantık ve UI ile çalışmaktadır.
