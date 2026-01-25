E-Ticaret Projesi: Uçtan Uca Geliştirme ve Teslimat Planı (Fazlar & Senkronizasyon)
Bu döküman, projenin back-end, admin panel ve front-end (kullanıcı yüzü) süreçlerinin nasıl senkronize ilerlemesi gerektiğini detaylandırır.

---

FAZ 1: Analiz, Mimari ve Veritabanı Tasarımı

Bu aşama projenin temelidir. Hata payı en düşük tutulmalıdır.

• Veritabanı Şeması: SQL Server/PostgreSQL üzerinde Tablo yapıları (Users, Products, Categories, Orders, OrderItems, Payments).

• Teknik Altyapı: .NET 8 Web API projesinin kurulması (Clean Architecture).

• Dokümantasyon: Swagger kurulumu.

FAZ 2: Kimlik Yönetimi ve Yetkilendirme (Auth)

• Backend: Identity Server veya JWT tabanlı Auth sistemi (Login/Register).

• Senkronizasyon: Admin Paneli ve Kullanıcı arayüzü için "Giriş" sayfaları bu aşamada eş zamanlı hazırlanmalıdır.

• Yetkilendirme: Müşteri (User) ve Yönetici (Admin) rollerinin tanımlanması.

FAZ 3: Ürün ve Kategori Yönetimi (KRİTİK SENKRONİZASYON)

Burada Backend ve Admin Panel el ele gitmelidir.

• Backend: Ürün ekleme, listeleme, silme ve kategori ağacı API'leri.

• Admin Panel (Senkron): Müşterinin ürün girişi yapabileceği "Ürün Yönetim Ekranı".

• Görsel Yönetim: Cloudinary/AWS S3 veya yerel depolama entegrasyonu.

FAZ 4: Sepet, Stok ve Sipariş Mantığı

• Backend: Sepet servisi (Redis tabanlı önerilir), stok kontrol mantığı.

• Front-end: Kullanıcının ürünleri sepete eklemesi ve miktar güncellemesi.

• Admin Panel (Senkron): Stok azaldığında yöneticiye uyarı verecek dashboard kartlarının hazırlanması.

FAZ 5: Ödeme Sistemleri ve Güvenlik

• Backend: Iyzico/Stripe API entegrasyonu.

• Güvenlik: Ödeme transaction kayıtları ve loglama.

• Teslimat: Sipariş onaylandıktan sonra faturanın otomatik oluşması.

FAZ 6: Sipariş Takip ve Kullanıcı Deneyimi

• Admin Panel: Siparişlerin durumunu (Hazırlanıyor, Kargoda) değiştirme ekranı.

• Front-end: Kullanıcının sipariş durumunu "Hesabım" sayfasında görmesi.

FAZ 7: Müşteri İçerik Yönetimi (CMS) ve Raporlama

• CMS: Ana sayfa bannerları ve kampanya metinlerinin panelden yönetilmesi.

• Raporlama: Admin panelde günlük ciro, en çok satan ürünler grafiği.

FAZ 8: Test, Optimizasyon ve Canlıya Geçiş (Handover)

• Test: Load testleri (büyük ölçekli proje olduğu için) ve ödeme testi.

• Handover: Admin panel kullanım kılavuzunun teslimi ve SSL kurulumu.

---

ÖNEMLİ SENKRONİZASYON NOTU: Bir modülün API'si bittiği an, o modülün Admin Panel karşılığını bitirmeden Kullanıcı Arayüzü tarafına geçmeyin. Bu, müşterinin veri girmesini ve sizin gerçek veriyle test yapmanızı sağlar.
