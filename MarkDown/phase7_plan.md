# Phase 7: Gelişmiş Arama & Filtreleme - Plan

## Objective

Mevcut ürün arama/filtreleme altyapısını olabildiğince kullanıcı-dostu, ölçeklenebilir ve hızlı hale getirmek. Temel filtreler tamamlandı; şimdi ileri seviye özellikler, doğrulama ve testleri ekleyip production'a hazır hale getireceğiz.

---

## Adımlar

### 1. Backend: Geliştirme & Entegrasyon

- [x] **Filtreleme endpoint'i**: `GET /api/Products/filter` (Mevcut) ✅
  - SearchQuery, CategoryId (hiyerarşi), BrandId, MinPrice, MaxPrice, InStock, SortBy, Page, PageSize
- [x] **FilterOptions**: MinPrice/MaxPrice, Brands with product counts, Categories (hiyerarşik) ✅
- [ ] **Variant attribute filtreleme** (Renk/Beden) — ProductVariant entity + stok ve filtre desteği 🟡
- [ ] **Elasticsearch entegrasyonu** (gelişmiş arama, autocomplete açısından) 🔴
- [ ] **Arama geçmişi / popüler aramalar kaydetme** (Analytics/DB) 🟡
- [ ] **Autocomplete endpoint** (kısa response + hızlı öneri) 🔴

**Files to update / add:**

- `Backend/ETicaret.Infrastructure/Services/CatalogService.cs` (variant & ES integration, **autocomplete eklendi** ✅)
- `Backend/ETicaret.API/Controllers/ProductsController.cs` (**autocomplete endpoint eklendi** ✅)
- DTOs: `ProductFilterDto`, `FilterOptionsDto`, **`AutocompleteDto` eklendi** ✅

---

### 2. Frontend: UI & UX

- [x] **Filtre sidebar / UI** — Kategori, Marka, Fiyat, Stok, Arama input ✅
- [x] **Fiyat inputları** (min/max) uygulanmış; slider isteğe bağlı geliştirme ✅
- [x] **Aktif filtre göstergesi** ve **Filtre temizleme** ✅
- [x] **Sıralama seçenekleri** (Fiyat, Yeni, Popüler) ✅
- [x] **Grid/List görünüm toggle** (kullanıcı tercihi) — İkon butonlarıyla çalışır durumda ✅
- [x] **Autocomplete / search suggestions dropdown** (instant öneri) — Backend endpoint + Frontend UI tamamlandı ✅
- [x] **Arama geçmişi** (localStorage ile son 5 arama) ✅
- [ ] **Variant seçimi UI (renk/beden filtreleri)** 🟡
- [ ] **E2E test senaryoları** (filtre uygulanması, temizleme, sayfalandırma) (planlanacak)

**Files to update:**

- `Frontend/app/products/page.tsx` (**autocomplete, grid/list toggle, arama geçmişi eklendi** ✅)
- `Frontend/components/*` (yeni küçük bileşenler: VariantFilter - planlanacak)

---

### 3. Admin

- [x] **Marka input -> text + datalist** ve **Yeni marka oluşturma** (ürün oluşturma formunda) ✅
- [ ] **Variant yönetimi (Admin)** — renk/beden ekleme, stok/price per variant 🟡

**Files to update:**

- `Frontend/app/admin/products/new/page.tsx` (variant fields)
- `Backend/CatalogService` (variant create/update)

---

### 4. Test & Doğrulama

- [ ] Unit test: `CatalogService.GetFilteredProductsAsync` mantığı (kategori hiyerarşisi, fiyat sınırları, marka, stok) ✅ planlanacak
- [ ] Integration test: `GET /api/Products/filter` endpoint senaryoları
- [ ] Frontend E2E: filtre uygulama, temizleme, sayfalandırma, sort

---

## Zaman Tahmini

- Variant sistemi (backend + admin + frontend): ~6 gün
- Elasticsearch + Autocomplete: ~1 hafta
- Grid/List toggle + küçük UI iyileştirmeleri: 1 gün
- Testler & Düzeltmeler: 2-3 gün

---

## Rollout Notları

- Elasticsearch entegrasyonu planlanırken mevcut `filter` endpoint'i fallback olarak kalmalı.
- Autocomplete için düşük gecikmeli cache (Redis) kullanılabilir.
- Her büyük değişiklik öncesi migration ve data seeding kontrol edilecek.

---

## Kabul Kriterleri

- Temel filtreleme senaryoları çalışıyor (kategori, marka, fiyat, stok, sıralama, sayfalandırma).
- Autocomplete eklendiğinde öneriler 100ms altı hedeflenecek (uygun cache/ES konfigürasyonu ile).
- Variant filtreleme ürün listeleme ve sepete ekleme akışını bozmamalı.

---

**Next Steps:** İleri seviye özellikler (Elasticsearch + Autocomplete + Variant filtering) önceliklendirilecek ve testler yazılacaktır.
