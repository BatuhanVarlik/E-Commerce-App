# Environment Variables Setup Guide

Bu proje hassas verileri (API anahtarları, veritabanı şifreleri, JWT secret'ları) environment variable'lar (.env dosyaları) kullanarak yönetir.

## Backend Kurulumu

1. `Backend` klasöründe `.env.example` dosyasını `.env` olarak kopyalayın:

   ```bash
   cd Backend
   cp .env.example .env
   ```

2. `.env` dosyasını açın ve gerçek değerlerinizi girin:

   ```env
   # Database Configuration
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=eticaret_db
   DB_USER=admin
   DB_PASSWORD=your_strong_password

   # Redis Configuration
   REDIS_CONNECTION=localhost:6379

   # JWT Configuration
   JWT_SECRET_KEY=your_very_long_and_secure_secret_key_here
   JWT_ISSUER=ETicaretAPI
   JWT_AUDIENCE=ETicaretClient
   JWT_DURATION_MINUTES=60

   # Iyzico Payment Gateway (Sandbox)
   IYZICO_API_KEY=your_iyzico_api_key
   IYZICO_SECRET_KEY=your_iyzico_secret_key
   IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
   ```

3. .env dosyası otomatik olarak Program.cs tarafından uygulama başlangıcında yüklenecektir.

## Frontend Kurulumu

1. `Frontend` klasöründe `.env.example` dosyasını `.env.local` olarak kopyalayın:

   ```bash
   cd Frontend
   cp .env.example .env.local
   ```

2. `.env.local` dosyasını açın ve API URL'inizi ayarlayın:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5162
   NODE_ENV=development
   ```

3. Next.js otomatik olarak `.env.local` dosyasını yükleyecektir.

## Güvenlik Notları

- ⚠️ **ÖNEMLİ**: `.env` ve `.env.local` dosyaları asla Git'e commit edilmemelidir!
- ✅ `.env.example` dosyaları Git'e commit edilmelidir (şablon olarak)
- ✅ `.gitignore` dosyası zaten `.env` dosyalarını görmezden gelecek şekilde yapılandırılmıştır
- 🔒 Production ortamında güçlü ve benzersiz değerler kullanın
- 🔒 JWT Secret Key en az 32 karakter olmalıdır

## Değişken Açıklamaları

### Backend

- `DB_HOST`: PostgreSQL veritabanı sunucu adresi
- `DB_PORT`: PostgreSQL port numarası (varsayılan: 5432)
- `DB_NAME`: Veritabanı adı
- `DB_USER`: Veritabanı kullanıcı adı
- `DB_PASSWORD`: Veritabanı şifresi
- `REDIS_CONNECTION`: Redis bağlantı dizesi
- `JWT_SECRET_KEY`: Token imzalama için gizli anahtar
- `JWT_ISSUER`: Token yayıncı adı
- `JWT_AUDIENCE`: Token alıcı adı
- `JWT_DURATION_MINUTES`: Token geçerlilik süresi (dakika)
- `IYZICO_API_KEY`: Iyzico ödeme sistemi API anahtarı
- `IYZICO_SECRET_KEY`: Iyzico gizli anahtarı
- `IYZICO_BASE_URL`: Iyzico API URL'i (sandbox veya production)

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API'nin base URL'i
- `NODE_ENV`: Ortam (development/production)

## Kontrol

Backend'in .env dosyasını doğru okuduğunu kontrol etmek için:

```bash
cd Backend/ETicaret.API
dotnet run
```

Frontend'in environment variable'ları doğru okuduğunu kontrol etmek için:

```bash
cd Frontend
npm run dev
```

Her iki uygulama da başarıyla başlamalı ve ilgili servislere (veritabanı, Redis) bağlanabilmelidir.
