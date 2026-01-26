# Image Upload System - Review Images

## 📋 Genel Bakış

Phase 8 ile birlikte ürün yorumlarına gerçek dosya yükleme özelliği eklendi. Kullanıcılar artık URL yerine doğrudan dosya seçerek resim yükleyebilirler.

---

## 🎯 Özellikler

### Backend (ASP.NET Core)

**Endpoint:** `POST /api/Upload/review-image`

- **Yetkilendirme:** `[Authorize]` (JWT token gerekli)
- **Content-Type:** `multipart/form-data`
- **Parametre:** `IFormFile file`

**Dosya Kontrolleri:**

- ✅ Desteklenen formatlar: JPG, JPEG, PNG, GIF, WEBP
- ✅ Maksimum boyut: 5MB
- ✅ Otomatik dosya adı: `{GUID}.{extension}`

**Dosya Saklama:**

- Konum: `Backend/ETicaret.API/wwwroot/uploads/reviews/`
- URL formatı: `/uploads/reviews/{filename}`
- Static file serving ile erişilebilir

**Response:**

```json
{
  "url": "/uploads/reviews/123e4567-e89b-12d3-a456-426614174000.jpg"
}
```

### Frontend (Next.js)

**Component:** `ReviewForm.tsx`

**Özellikler:**

1. **File Input**
   - Hidden file input + custom styled button
   - Accept: `image/jpeg,image/jpg,image/png,image/gif,image/webp`

2. **Image Preview**
   - FileReader ile base64 preview
   - Next.js Image component (200x200)
   - Remove button (X butonu)

3. **Upload Flow**

   ```
   User selects file → Preview shown → Form submitted
   → Image uploaded first → URL returned → Review created with URL
   ```

4. **Error Handling**
   - Dosya tipi kontrolü (client-side)
   - Dosya boyutu kontrolü (client-side)
   - Upload hataları (server-side)

---

## 🔧 Teknik Detaylar

### Backend Implementation

**UploadController.cs:**

```csharp
[HttpPost("review-image")]
public async Task<IActionResult> UploadReviewImage(IFormFile file)
{
    // 1. Validation
    // 2. Create upload folder if not exists
    // 3. Generate unique filename (GUID)
    // 4. Save file to wwwroot/uploads/reviews
    // 5. Return URL
}
```

**Program.cs:**

```csharp
// Static files middleware eklendi
app.UseStaticFiles();
```

### Frontend Implementation

**ReviewForm.tsx:**

```tsx
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>("");
const [uploading, setUploading] = useState(false);

// File selection
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  // Validation
  // Create preview with FileReader
};

// Upload function
const uploadImage = async (): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await api.post("/api/Upload/review-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.url;
};

// Submit flow
const handleSubmit = async () => {
  // 1. Upload image first (if exists)
  const imageUrl = await uploadImage();

  // 2. Create review with imageUrl
  await api.post("/api/Reviews", {
    productId,
    rating,
    comment,
    imageUrl,
  });
};
```

**next.config.ts:**

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '5162',
      pathname: '/uploads/**',
    },
  ],
}
```

---

## 📁 Dosya Yapısı

```
Backend/
  ETicaret.API/
    Controllers/
      UploadController.cs          ← YENİ
    wwwroot/                        ← YENİ
      uploads/
        reviews/
          .gitkeep
          {guid}.jpg               (git ignore)
          {guid}.png               (git ignore)

Frontend/
  components/
    ReviewForm.tsx                  ← GÜNCELLENDİ
  next.config.ts                    ← GÜNCELLENDİ
```

---

## 🔐 Güvenlik

1. **Authentication Required**
   - Upload endpoint `[Authorize]` ile korumalı
   - Sadece login kullanıcılar yükleyebilir

2. **File Type Validation**
   - Client-side: input accept attribute
   - Server-side: extension kontrolü

3. **File Size Limit**
   - Client-side: JS ile kontrol
   - Server-side: 5MB limit

4. **Unique Filenames**
   - GUID kullanarak çakışma önlenir
   - Overwrite riski yok

5. **Git Security**
   - Uploaded files `.gitignore`'da
   - Sadece `.gitkeep` dosyası commit edilir

---

## 🚀 Kullanım

### Kullanıcı Perspektifi

1. Ürün detay sayfasında "Yorum Yaz" butonuna tıkla
2. Rating seç, yorum yaz
3. "Resim Seç" butonuna tıkla
4. Dosya seç (max 5MB, JPG/PNG/GIF/WEBP)
5. Preview'da göster
6. İstenirse X butonuyla kaldır
7. "Yorumu Gönder" tıkla
8. Otomatik yüklenir ve yorum oluşturulur

### Developer Test

**Manual Test:**

```bash
# Backend çalıştır
cd Backend/ETicaret.API
dotnet run

# Frontend çalıştır
cd Frontend
npm run dev

# Browser:
# 1. Login ol
# 2. Herhangi bir ürün sayfasına git
# 3. Yorum formunu test et
```

**API Test (Postman/Thunder Client):**

```
POST http://localhost:5162/api/Upload/review-image
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: multipart/form-data
Body:
  file: [Select File]

Response:
{
  "url": "/uploads/reviews/{guid}.jpg"
}
```

---

## 📊 Performans

### Optimizations

1. **Next.js Image Optimization**
   - Otomatik resim optimizasyonu
   - Lazy loading
   - Responsive images

2. **Frontend Validation**
   - Gereksiz upload isteklerini önler
   - Client-side hata mesajları

3. **Static File Serving**
   - ASP.NET Core native static file middleware
   - Hızlı dosya servisi

---

## 🔄 Gelecek İyileştirmeler

### Öncelikli

1. **Cloud Storage**
   - Azure Blob Storage
   - AWS S3
   - Daha ölçeklenebilir

2. **Image Processing**
   - Otomatik resize
   - Thumbnail oluşturma
   - Format dönüştürme (WebP)

3. **CDN Integration**
   - Faster image delivery
   - Global caching

### Orta Öncelik

4. **Multiple Images**
   - Birden fazla resim yükleme
   - Image gallery

5. **Compression**
   - Client-side image compression
   - Bandwidth tasarrufu

6. **Progress Bar**
   - Upload progress gösterimi
   - Better UX

---

## ❌ Troubleshooting

### Problem: "Resim yüklenemiyor"

**Çözüm:**

- wwwroot/uploads/reviews klasörü var mı kontrol et
- Klasör write permission var mı kontrol et
- JWT token geçerli mi kontrol et

### Problem: "Next.js Image error"

**Çözüm:**

- next.config.ts'de remote pattern var mı kontrol et
- Backend URL doğru mu kontrol et
- NEXT_PUBLIC_API_URL env var set mi?

### Problem: "Dosya boyutu hatası"

**Çözüm:**

- 5MB'ın altında mı kontrol et
- Backend'de IIS max request size ayarı (production)

---

**Phase 8 Completed with Real File Upload! 🎉**
