# E-Ticaret Projesi Çalıştırma Rehberi

Bu proje, **.NET 8 Web API** (Backend) ve **Next.js** (Frontend) kullanılarak geliştirilmiş modern bir E-Ticaret uygulamasıdır. Veritabanı olarak **PostgreSQL** kullanılmaktadır.

## Gereksinimler

Projeyi çalıştırmadan önce aşağıdaki araçların yüklü olduğundan emin olun:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Veritabanı için)
- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (LTS sürümü önerilir)

---

## 1. Veritabanını Başlatma

Veritabanı (PostgreSQL) Docker üzerinde çalışmaktadır. Proje ana dizinindeyken aşağıdaki komutu çalıştırın:

```bash
docker-compose up -d
```

Bu komut, veritabanı konteynerini arka planda başlatır.

---

## 2. Backend'i (API) Çalıştıra

Backend servisini başlatmak için aşağıdaki komutu kullanın. `dotnet watch`, kod değişikliklerini algılayıp sunucuyu otomatik olarak yeniden başlatır.

```bash
dotnet watch run --project Backend/ETicaret.API/ETicaret.API.csproj
```

- **API Adresi:** `http://localhost:5162`
- **Swagger UI (Test):** [http://localhost:5162/swagger](http://localhost:5162/swagger)

---

## 3. Frontend'i (Arayüz) Çalıştırma

Yeni bir terminal penceresi açın ve `frontend` klasörüne gidip uygulamayı başlatın:

```bash
cd frontend
npm run dev
```

- **Uygulama Adresi:** [http://localhost:3000](http://localhost:3000)

---

## Önemli Bilgiler

### Admin Girişi

Admin paneline erişmek için aşağıdaki bilgileri kullanabilirsiniz:

- **Email:** `admin@admin.com`
- **Şifre:** `Admin123!`
- **Panel URL:** [http://localhost:3000/admin](http://localhost:3000/admin) (Giriş yaptıktan sonra)

### Test Kullanıcısı (Müşteri)

- Veritabanı ilk oluştuğunda varsayılan bir müşteri kullanıcısı olmayabilir. "Kayıt Ol" sayfasından yeni bir kullanıcı oluşturabilirsiniz.

### Yaygın Sorunlar & Çözümler

- **Port Çakışması (Address already in use):**
  Backend çalışmazsa, 5162 portunu kullanan eski bir süreç kalmış olabilir (Mac):

  ```bash
  lsof -i :5162 | grep LISTEN | awk '{print $2}' | xargs kill -9
  ```

- **Veritabanı Bağlantı Hatası:**
  Docker konteynerinin çalıştığından emin olun (`docker ps`). `appsettings.json` içindeki bağlantı dizesinin (ConnectionStrings) Docker ayarlarıyla eşleştiğini kontrol edin.
