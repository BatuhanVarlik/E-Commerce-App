# 🚀 E-Ticaret Projesi - Canlıya Alma ve İyileştirme Planı

**Oluşturulma Tarihi:** 4 Şubat 2026  
**Proje:** E-Commerce App  
**Teknoloji Stack:** .NET 8 (Backend) + Next.js 16 (Frontend) + PostgreSQL + Redis

---

## 📊 Mevcut Durum Analizi

### ✅ Tamamlanan Özellikler

| Modül            | Durum | Açıklama                         |
| ---------------- | ----- | -------------------------------- |
| Kimlik Doğrulama | ✅    | JWT + Google OAuth + 2FA         |
| Ürün Yönetimi    | ✅    | CRUD, Varyantlar, Görsel Yükleme |
| Kategori/Marka   | ✅    | Hiyerarşik yapı                  |
| Sepet Sistemi    | ✅    | Redis-backed, Stok kontrol       |
| Ödeme Sistemi    | ✅    | Iyzico entegrasyonu              |
| Sipariş Yönetimi | ✅    | Durum takibi, Kargo              |
| Wishlist         | ✅    | Fiyat/Stok uyarıları             |
| Kupon Sistemi    | ✅    | Çoklu kupon tipleri              |
| Yorum Sistemi    | ✅    | Rating, Moderasyon               |
| Admin Panel      | ✅    | Dashboard, Raporlama             |
| Canlı Destek     | ✅    | Chatbot, Agent sistemi           |
| Güvenlik         | ✅    | Rate limiting, XSS/CSRF koruması |
| Email Servisi    | ✅    | SMTP entegrasyonu                |
| Öneri Sistemi    | ✅    | AI-based recommendations         |

### ⚠️ Eksik/İyileştirilmesi Gereken Alanlar

- [ ] Production-ready Docker yapılandırması
- [ ] CI/CD Pipeline
- [ ] Monitoring & Logging (ELK/Prometheus)
- [ ] Load Balancing
- [ ] SSL/HTTPS yapılandırması
- [ ] CDN entegrasyonu
- [ ] Backup stratejisi
- [ ] Test coverage

---

## 🎯 BÖLÜM 1: CANLI ALMA GEREKSİNİMLERİ

### 1.1 Altyapı Gereksinimleri

#### Sunucu Seçenekleri

| Seçenek                        | Avantaj           | Dezavantaj      | Maliyet     |
| ------------------------------ | ----------------- | --------------- | ----------- |
| **VPS (Hetzner/DigitalOcean)** | Tam kontrol, Ucuz | Manuel yönetim  | €10-50/ay   |
| **Azure App Service**          | .NET uyumu, Kolay | Daha pahalı     | $50-200/ay  |
| **AWS (EC2 + RDS)**            | Ölçeklenebilir    | Karmaşık        | $100-300/ay |
| **Railway/Render**             | Basit deployment  | Sınırlı kontrol | $20-100/ay  |

#### Önerilen Minimum Konfigürasyon

```
Backend Sunucu:
- 2 vCPU, 4GB RAM
- Ubuntu 22.04 LTS
- .NET 8 Runtime

Database Sunucu:
- PostgreSQL 16 (Managed tercih edilir)
- 2 vCPU, 4GB RAM, 50GB SSD
- Otomatik backup

Redis:
- Redis Cloud veya Managed Redis
- 1GB RAM minimum

Frontend:
- Vercel (Önerilen - Next.js için optimize)
- veya Netlify
```

### 1.2 Domain & SSL

```bash
# Gerekli adımlar:
1. Domain satın al (Namecheap, GoDaddy, vb.)
2. DNS kayıtlarını yapılandır
3. SSL sertifikası (Let's Encrypt - ücretsiz)
4. WWW ve non-WWW yönlendirmeleri
```

### 1.3 Production Environment Variables

```env
# Backend (.env.production)
DB_HOST=production-db-host.com
DB_PORT=5432
DB_NAME=eticaret_production
DB_USER=eticaret_admin
DB_PASSWORD=<GÜÇLÜ_ŞİFRE_32_KARAKTER>

REDIS_CONNECTION=redis-host:6379,password=<REDIS_PASSWORD>

JWT_SECRET_KEY=<MINIMUM_64_KARAKTER_RANDOM_STRING>
JWT_ISSUER=https://api.yourdomain.com
JWT_AUDIENCE=https://yourdomain.com
JWT_DURATION_MINUTES=30

IYZICO_API_KEY=<PRODUCTION_API_KEY>
IYZICO_SECRET_KEY=<PRODUCTION_SECRET_KEY>
IYZICO_BASE_URL=https://api.iyzipay.com  # Production URL

GOOGLE_CLIENT_ID=<PRODUCTION_CLIENT_ID>

EMAIL_SMTP_HOST=smtp.provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=noreply@yourdomain.com
EMAIL_SMTP_PASSWORD=<EMAIL_PASSWORD>
EMAIL_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=E-Ticaret Sitesi

# Frontend (.env.production)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 🎯 BÖLÜM 2: DEPLOYMENT ADIMLARI

### 2.1 Phase D1: Docker Production Setup (1-2 gün)

#### Dockerfile - Backend

```dockerfile
# Backend/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ETicaret.API/ETicaret.API.csproj", "ETicaret.API/"]
COPY ["ETicaret.Application/ETicaret.Application.csproj", "ETicaret.Application/"]
COPY ["ETicaret.Domain/ETicaret.Domain.csproj", "ETicaret.Domain/"]
COPY ["ETicaret.Infrastructure/ETicaret.Infrastructure.csproj", "ETicaret.Infrastructure/"]
RUN dotnet restore "ETicaret.API/ETicaret.API.csproj"
COPY . .
WORKDIR "/src/ETicaret.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ETicaret.API.dll"]
```

#### Dockerfile - Frontend

```dockerfile
# Frontend/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### docker-compose.production.yml

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    env_file:
      - ./Backend/.env.production
    depends_on:
      - postgres
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./Frontend/.env.production
    depends_on:
      - backend
    restart: always

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./certbot:/var/www/certbot
    depends_on:
      - backend
      - frontend
    restart: always

volumes:
  postgres_data:
  redis_data:
```

### 2.2 Phase D2: CI/CD Pipeline (2-3 gün)

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "8.0.x"

      - name: Run Backend Tests
        run: |
          cd Backend
          dotnet test --configuration Release

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Run Frontend Tests
        run: |
          cd Frontend
          npm ci
          npm run lint
          npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./Backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest

      - name: Build and Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./Frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/eticaret
            docker compose pull
            docker compose up -d --remove-orphans
            docker system prune -f
```

### 2.3 Phase D3: Nginx & SSL Configuration (1 gün)

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:80;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API Routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth Rate Limiting
        location /api/Auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
        }

        # Static Files (Uploads)
        location /uploads {
            proxy_pass http://backend;
            proxy_cache_valid 200 1d;
            expires 1d;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### 2.4 Phase D4: Monitoring Setup (2-3 gün)

#### Health Check Endpoint (Backend'e eklenecek)

```csharp
// HealthController.cs
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConnectionMultiplexer _redis;

    [HttpGet]
    public async Task<IActionResult> Check()
    {
        var health = new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Database = await CheckDatabase(),
            Redis = await CheckRedis(),
            Version = "1.0.0"
        };
        return Ok(health);
    }
}
```

#### Prometheus + Grafana Stack

```yaml
# monitoring/docker-compose.yml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"

volumes:
  grafana_data:
```

### 2.5 Phase D5: Backup Strategy (1 gün)

```bash
#!/bin/bash
# backup.sh - Günlük çalışacak

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# PostgreSQL Backup
docker exec postgres pg_dump -U admin eticaret_db > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Uploads Backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/wwwroot/uploads

# 7 günden eski backupları sil
find $BACKUP_DIR -type f -mtime +7 -delete

# S3'e yükle (opsiyonel)
aws s3 sync $BACKUP_DIR s3://your-bucket/backups/
```

---

## 🎯 BÖLÜM 3: İYİLEŞTİRME ÖNERİLERİ

### 3.1 Performans İyileştirmeleri

#### Priority: 🔴 Yüksek

| İyileştirme          | Açıklama                           | Tahmini Süre |
| -------------------- | ---------------------------------- | ------------ |
| Database Indexing    | Sık kullanılan sorgular için index | 1 gün        |
| Query Optimization   | N+1 problemlerinin giderilmesi     | 2 gün        |
| Response Compression | Gzip/Brotli                        | 0.5 gün      |
| Image Optimization   | WebP dönüşümü, lazy loading        | 2 gün        |
| Redis Cache Strategy | Daha akıllı cache invalidation     | 2 gün        |

#### Yapılacaklar:

```sql
-- Önerilen Database Index'leri
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created ON products(created_at DESC);
```

### 3.2 Güvenlik İyileştirmeleri

#### Priority: 🔴 Yüksek

| İyileştirme             | Durum        | Açıklama                               |
| ----------------------- | ------------ | -------------------------------------- |
| Content Security Policy | ⚠️ Eksik     | XSS koruması için CSP header           |
| Input Validation        | ✅ Var       | FluentValidation ile güçlendirilebilir |
| SQL Injection           | ✅ Korumalı  | EF Core parametreli sorgular           |
| Rate Limiting           | ✅ Var       | Endpoint bazlı fine-tuning             |
| Audit Logging           | ✅ Var       | Elasticsearch'e gönderim               |
| Penetration Testing     | ⚠️ Yapılmalı | OWASP ZAP ile test                     |

### 3.3 SEO & Marketing İyileştirmeleri

#### Priority: 🟡 Orta

```typescript
// Frontend SEO İyileştirmeleri
// app/products/[slug]/page.tsx

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  return {
    title: `${product.name} | E-Ticaret`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]],
      type: "product",
    },
    other: {
      "product:price:amount": product.price,
      "product:price:currency": "TRY",
    },
  };
}

// JSON-LD Structured Data
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.images,
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: "TRY",
    availability:
      product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
  },
};
```

### 3.4 Yeni Özellik Önerileri

#### Phase 25: Push Notifications (3-5 gün)

```
- Web Push API entegrasyonu
- Firebase Cloud Messaging (FCM)
- Sipariş durumu bildirimleri
- Fiyat düşüşü bildirimleri
- Stok uyarıları
```

#### Phase 26: Multi-Language Support (5-7 gün)

```
- i18n altyapısı (next-intl)
- Türkçe/İngilizce dil desteği
- URL yapısı: /tr/urunler, /en/products
- Admin panelden çeviri yönetimi
```

#### Phase 27: Mobile App (PWA) (3-5 gün)

```
- Progressive Web App dönüşümü
- Offline desteği
- App-like deneyim
- Push notifications
- Home screen install
```

#### Phase 28: Advanced Analytics (5-7 gün)

```
- Google Analytics 4 entegrasyonu
- Özel event tracking
- Conversion funnel analizi
- A/B testing altyapısı
- Heatmap entegrasyonu (Hotjar)
```

#### Phase 29: Marketplace Features (10-14 gün)

```
- Multi-vendor desteği
- Satıcı paneli
- Komisyon sistemi
- Satıcı rating
- Satıcı onay süreci
```

#### Phase 30: API Versioning & Documentation (3-5 gün)

```
- API versiyonlama (/api/v1, /api/v2)
- Swagger UI iyileştirmeleri
- API rate limiting per client
- API key yönetimi
- Webhook desteği
```

---

## 🎯 BÖLÜM 4: UYGULAMA TAKVİMİ

### Hafta 1-2: Production Hazırlığı

| Gün   | Görev                           | Öncelik |
| ----- | ------------------------------- | ------- |
| 1-2   | Docker Production Setup         | 🔴      |
| 3-4   | CI/CD Pipeline                  | 🔴      |
| 5     | SSL & Nginx                     | 🔴      |
| 6-7   | Environment Variables & Secrets | 🔴      |
| 8-10  | Monitoring & Logging            | 🔴      |
| 11-12 | Backup Strategy                 | 🔴      |
| 13-14 | Load Testing & Bug Fixes        | 🔴      |

### Hafta 3-4: İyileştirmeler

| Gün   | Görev                    | Öncelik |
| ----- | ------------------------ | ------- |
| 15-16 | Database Optimization    | 🔴      |
| 17-18 | Image Optimization & CDN | 🟡      |
| 19-20 | SEO İyileştirmeleri      | 🟡      |
| 21-22 | Security Audit           | 🔴      |
| 23-24 | Performance Testing      | 🟡      |
| 25-26 | Documentation            | 🟡      |
| 27-28 | Final QA & Go-Live       | 🔴      |

### Hafta 5+: Yeni Özellikler

| Hafta | Görev                  | Öncelik |
| ----- | ---------------------- | ------- |
| 5     | Push Notifications     | 🟡      |
| 6     | Multi-Language Support | 🟢      |
| 7     | PWA Dönüşümü           | 🟢      |
| 8-9   | Advanced Analytics     | 🟢      |
| 10-12 | Marketplace Features   | 🟢      |

---

## 🎯 BÖLÜM 5: CHECKLIST - CANLI ALMA ÖNCESİ

### Güvenlik ✓

- [ ] Tüm production secrets güvenli yerde
- [ ] HTTPS zorunlu
- [ ] Rate limiting aktif
- [ ] CORS sadece production domain
- [ ] SQL injection testleri yapıldı
- [ ] XSS testleri yapıldı
- [ ] Hassas veriler loglanmıyor

### Performans ✓

- [ ] Database index'leri eklendi
- [ ] Gzip compression aktif
- [ ] Static file caching yapılandırıldı
- [ ] Redis cache stratejisi belirlendi
- [ ] Load test yapıldı (min 100 concurrent user)

### Deployment ✓

- [ ] CI/CD pipeline çalışıyor
- [ ] Health check endpoint'leri var
- [ ] Rollback stratejisi belirlendi
- [ ] Backup otomasyonu kuruldu
- [ ] Monitoring dashboard'u hazır

### Business ✓

- [ ] Iyzico production hesabı aktif
- [ ] Email servis sağlayıcı ayarlandı
- [ ] Google OAuth production credentials
- [ ] Kullanım koşulları ve gizlilik politikası
- [ ] KVKK uyumluluğu kontrol edildi

### Test ✓

- [ ] Tüm kritik user flow'lar test edildi
- [ ] Ödeme akışı test edildi (gerçek kart)
- [ ] Email bildirimleri test edildi
- [ ] Mobile responsive test edildi
- [ ] Cross-browser test yapıldı

---

## 📌 Sonraki Adımlar

1. **Hemen Başla:** Docker production setup
2. **Bu Hafta:** CI/CD pipeline ve SSL
3. **Gelecek Hafta:** Monitoring ve security audit
4. **2 Hafta Sonra:** Go-Live! 🎉

---

## 📚 Faydalı Kaynaklar

- [.NET Production Best Practices](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

_Bu döküman, projenin canlıya alınması ve gelecek geliştirmeleri için kapsamlı bir rehber niteliğindedir. Sorularınız için iletişime geçin._
