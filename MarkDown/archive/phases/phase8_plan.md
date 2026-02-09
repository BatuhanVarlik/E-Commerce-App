# Phase 8: Ürün Yorumları & Değerlendirme - Plan

## Objective

Kullanıcıların ürünler hakkında yorum yapabilmesini, yıldız puanı verebilmesini ve diğer kullanıcıların yorumlarını görebilmesini sağlamak. Admin moderasyonu ve **gerçek dosya yükleme** sistemi eklemek.

---

## Adımlar

### 1. Backend: Review Sistemi (Tamamlandı ✅)

- [x] **Review Entity** — Zaten mevcut ✅
  - UserId, ProductId, Rating (1-5), Comment, ImageUrl
  - IsApproved (admin onayı), HelpfulCount, UnhelpfulCount
- [x] **Review CRUD endpoints** — ReviewsController mevcut ✅
  - GET /api/Reviews/product/{productId}
  - POST /api/Reviews (yorum oluştur)
  - PUT /api/Reviews/{reviewId} (yorum güncelle)
  - DELETE /api/Reviews/{reviewId} (yorum sil)
- [x] **Vote endpoints** — Yararlı/Yararsız oylama ✅
  - POST /api/Reviews/{reviewId}/vote
- [x] **Admin endpoints** — Moderasyon ✅
  - GET /api/admin/reviews/pending (onay bekleyenler)
  - POST /api/admin/reviews/{reviewId}/approve
  - POST /api/admin/reviews/{reviewId}/reject
  - GET /api/admin/reviews (tüm yorumlar, filtreleme)
- [x] **Image upload** — Gerçek dosya yükleme sistemi ✅
  - POST /api/Upload/review-image (multipart/form-data)
  - DELETE /api/Upload/review-image
  - wwwroot/uploads/reviews klasörü
  - Static file serving (Program.cs)

**Updated files:**

- `Backend/ETicaret.API/Controllers/UploadController.cs` (YENİ)
- `Backend/ETicaret.API/Controllers/Admin/AdminReviewsController.cs` (YENİ)
- `Backend/ETicaret.Infrastructure/Services/ReviewService.cs` (approve/reject, duplicate check)
- `Backend/ETicaret.API/Program.cs` (UseStaticFiles eklendi)

---

### 2. Frontend: Review UI & UX (Tamamlandı ✅)

- [x] **Product Detail Page - Reviews Section** ✅
  - Yorumları listeleme
  - Yıldız dağılımı grafiği (5★: x, 4★: y, ...)
  - Ortalama rating gösterimi
  - ~~Filtreleme (En yeni, En yararlı, Yıldıza göre)~~ (Opsiyonel)
- [x] **Review Form** ✅
  - Yıldız seçici (1-5 star rating) - StarRating component
  - Yorum textarea (min 10 karakter)
  - **Gerçek dosya yükleme** (multipart/form-data)
  - Image preview & remove
  - Validation (client + server)
- [x] **Review Card** ✅
  - Kullanıcı adı, tarih, yıldız
  - Yorum metni
  - Resim gösterimi (Next.js Image)
  - Yararlı/Yararsız butonları (vote tracking)
- [x] **Admin Panel - Review Moderation** ✅
  - Onay bekleyen yorumlar listesi
  - Onayla/Reddet butonları
  - Tab filtreleme (Bekleyen/Onaylanan/Tümü)

**Created/Updated files:**

- `Frontend/app/product/[id]/page.tsx` (review section eklendi)
- `Frontend/components/ReviewForm.tsx` (YENİ - file upload ile)
- `Frontend/components/ReviewCard.tsx` (YENİ)
- `Frontend/components/StarRating.tsx` (YENİ - interaktif yıldız seçici)
- `Frontend/app/admin/reviews/page.tsx` (YENİ - moderasyon)
- `Frontend/next.config.ts` (remote image pattern eklendi)

---

### 3. Validation & Business Rules (Tamamlandı ✅)

- [x] **Bir kullanıcı bir ürüne sadece 1 yorum yapabilir** (ReviewService duplicate check)
- [x] **Rating 1-5 arası olmalı** (frontend + backend validation)
- [x] **Yorum minimum 10 karakter** (frontend + backend)
- [x] **Admin onayından geçmemiş yorumlar gösterilmez** (IsApproved=true filtresi)
- [x] **Dosya tipi kontrolü** (JPG, PNG, GIF, WEBP only)
- [x] **Dosya boyutu kontrolü** (max 5MB)
- [ ] **Sadece satın alan kullanıcılar yorum yapabilir** (opsiyonel, gelişmiş - gelecek için)

---

### 4. Test & Doğrulama (İhtiyaç Duyuldukça)

- [ ] Unit test: ReviewService metodları
- [ ] Integration test: Review endpoints
- [ ] Frontend E2E: Yorum yazma, oylama, moderasyon

---

## Zaman Tahmini

- ~~Backend (Admin moderasyon + image upload): 1 gün~~ ✅
- ~~Frontend (Review UI + Form + StarRating): 2 gün~~ ✅
- ~~Admin Panel (Review moderation): 0.5 gün~~ ✅
- ~~Testler & Düzeltmeler: 0.5 gün~~ ✅

**~~Toplam:** ~4 gün~~ → **Tamamlandı! 🎉**

---

## Kabul Kriterleri

- [x] Kullanıcılar ürün detay sayfasından yorum yazabiliyor ve yıldız verebiliyor.
- [x] Kullanıcılar gerçek dosya yükleyebiliyor (URL yerine).
- [x] Image preview çalışıyor.
- [x] Yorumlar admin onayından sonra görünüyor.
- [x] Yararlı/Yararsız oylama çalışıyor ve sayaçlar güncelleniyor.
- [x] Admin panelinden bekleyen yorumlar onaylanabiliyor veya reddedilebiliyor.
- [x] Yıldız dağılımı ve ortalama rating doğru hesaplanıyor.
- [x] Duplicate review kontrolü çalışıyor.
- [x] Static file serving çalışıyor (uploaded images erişilebilir).

---

## 🎉 Yeni Özellikler (Image Upload)

### Backend

- ✅ `UploadController.cs` - Multipart/form-data ile dosya yükleme
- ✅ `wwwroot/uploads/reviews` klasör yapısı
- ✅ Static file middleware (`app.UseStaticFiles()`)
- ✅ Dosya tipi ve boyut validasyonu
- ✅ GUID ile unique filename

### Frontend

- ✅ File input + custom UI
- ✅ Image preview (FileReader)
- ✅ Remove image button
- ✅ FormData ile multipart upload
- ✅ Next.js remote image pattern
- ✅ Loading states (uploading/submitting)

### Documentation

- ✅ `IMAGE_UPLOAD_GUIDE.md` - Detaylı kullanım kılavuzu

**Phase 8 Completed with Real File Upload System! 🚀**

---

**Next Steps:** Backend admin endpoints eklenecek, frontend review UI oluşturulacak.
