# 🎓 İlk Kez Canlıya Alma Rehberi (Başlangıç Seviyesi)

Bu rehber, hiç deneyimi olmayan birinin bir web projesini canlıya almasını sağlamak için hazırlanmıştır. Her adım detaylı açıklanmıştır.

---

## 📚 İçindekiler

1. [Temel Kavramlar](#1-temel-kavramlar)
2. [Ne Satın Almalıyım?](#2-ne-satın-almalıyım)
3. [Domain (Alan Adı) Alma](#3-domain-alan-adı-alma)
4. [Sunucu Kiralama](#4-sunucu-kiralama)
5. [Sunucuya Bağlanma](#5-sunucuya-bağlanma)
6. [Sunucu Kurulumu](#6-sunucu-kurulumu)
7. [Projeyi Yükleme](#7-projeyi-yükleme)
8. [SSL Sertifikası (HTTPS)](#8-ssl-sertifikası-https)
9. [Ödeme Sistemi (Iyzico)](#9-ödeme-sistemi-iyzico)
10. [Email Servisi](#10-email-servisi)
11. [Canlıya Alma](#11-canlıya-alma)
12. [Bakım ve İzleme](#12-bakım-ve-izleme)
13. [Maliyet Özeti](#13-maliyet-özeti)
14. [Sık Sorulan Sorular](#14-sık-sorulan-sorular)

---

## 1. Temel Kavramlar

### 🌐 Domain (Alan Adı) Nedir?

- Sitenizin adresi: `www.sitenim.com`
- İnsanlar bu adresi yazarak sitenize ulaşır
- Yıllık kiralanır (genellikle 100-500₺/yıl)

### 🖥️ Sunucu (Server) Nedir?

- Projenizin çalıştığı bilgisayar
- 7/24 açık, internete bağlı
- Aylık kiralanır (genellikle 200-1000₺/ay)

### 🔒 SSL Sertifikası Nedir?

- Sitenizi `http://` yerine `https://` yapar
- Veri güvenliği sağlar (şifreleme)
- Tarayıcıda "güvenli" yazar
- Let's Encrypt ile **ücretsiz** alınabilir

### 🐳 Docker Nedir?

- Uygulamaları paketleyip çalıştıran bir araç
- "Benim bilgisayarımda çalışıyor" problemini çözer
- Kurulum kolaylığı sağlar

### 🔄 CI/CD Nedir?

- Continuous Integration / Continuous Deployment
- Kod değişikliği yaptığında otomatik test ve yayınlama
- GitHub'a push = otomatik güncelleme

---

## 2. Ne Satın Almalıyım?

### Zorunlu Olanlar:

| Ürün            | Nereden                        | Yaklaşık Fiyat |
| --------------- | ------------------------------ | -------------- |
| Domain (.com)   | Namecheap, GoDaddy, İsimTescil | 200-400₺/yıl   |
| VPS Sunucu      | Hetzner, DigitalOcean, Contabo | 300-800₺/ay    |
| SSL Sertifikası | Let's Encrypt                  | **Ücretsiz**   |

### Opsiyonel (İleride):

| Ürün           | Nereden                       | Yaklaşık Fiyat       |
| -------------- | ----------------------------- | -------------------- |
| Email Servisi  | Mailgun, SendGrid, Amazon SES | 0-100₺/ay            |
| CDN            | Cloudflare                    | **Ücretsiz** (temel) |
| Monitoring     | UptimeRobot                   | **Ücretsiz** (temel) |
| Backup Storage | AWS S3, Backblaze B2          | 10-50₺/ay            |

### 💡 Başlangıç için Önerim:

```
Hetzner CX21 VPS (4GB RAM, 2 vCPU) = ~€5/ay (~200₺)
+ .com Domain = ~$12/yıl (~400₺)
+ Let's Encrypt SSL = Ücretsiz

Toplam: ~250₺/ay + 400₺/yıl domain
```

---

## 3. Domain (Alan Adı) Alma

### Adım 1: Domain Seçimi

- Kısa ve akılda kalıcı olsun
- Türkçe karakter kullanma (ş, ı, ö, ü, ç, ğ)
- `.com` tercih et (en güvenilir)

### Adım 2: Namecheap'ten Alma (Önerilen)

1. [namecheap.com](https://namecheap.com) adresine git
2. Hesap oluştur
3. İstediğin domain'i ara
4. Sepete ekle ve satın al
5. "WhoisGuard" ücretsiz, aktif et (gizlilik için)

### Adım 3: DNS Ayarları

Domain aldıktan sonra DNS ayarlarını yapacaksın. Bu, domain'inin sunucunu göstermesini sağlar.

```
Namecheap Paneli → Domain List → Manage → Advanced DNS

Eklenecek kayıtlar:
┌─────────┬─────────────┬────────────────┬─────────┐
│ Type    │ Host        │ Value          │ TTL     │
├─────────┼─────────────┼────────────────┼─────────┤
│ A       │ @           │ SUNUCU_IP      │ Auto    │
│ A       │ www         │ SUNUCU_IP      │ Auto    │
│ A       │ api         │ SUNUCU_IP      │ Auto    │
└─────────┴─────────────┴────────────────┴─────────┘

SUNUCU_IP = Sunucunu kiraladıktan sonra alacağın IP adresi
Örnek: 95.216.123.45
```

---

## 4. Sunucu Kiralama

### Hetzner'dan Sunucu Alma (Önerilen - Ucuz ve Güvenilir)

#### Adım 1: Hesap Oluştur

1. [hetzner.com](https://hetzner.com) adresine git
2. Sağ üstten "Sign Up" tıkla
3. Email ve şifre ile kayıt ol
4. Email doğrula
5. Kimlik doğrulama yapılacak (pasaport/kimlik fotoğrafı)

#### Adım 2: Sunucu Oluştur (Cloud Console)

1. [console.hetzner.cloud](https://console.hetzner.cloud) adresine git
2. "New Project" → İsim ver (örn: "E-Ticaret")
3. "Add Server" tıkla

#### Adım 3: Sunucu Seçenekleri

```
┌─────────────────────────────────────────────────────┐
│ LOCATION (Konum)                                     │
│ ✓ Helsinki veya Falkenstein (Avrupa, hızlı)         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ IMAGE (İşletim Sistemi)                              │
│ ✓ Ubuntu 22.04                                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ TYPE (Sunucu Tipi)                                   │
│                                                      │
│ Başlangıç için: CX21                                 │
│ - 2 vCPU                                             │
│ - 4 GB RAM                                           │
│ - 40 GB SSD                                          │
│ - €4.85/ay (~200₺)                                   │
│                                                      │
│ Büyüdükten sonra: CX31                               │
│ - 2 vCPU                                             │
│ - 8 GB RAM                                           │
│ - 80 GB SSD                                          │
│ - €8.98/ay (~370₺)                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SSH KEY (Çok Önemli!)                                │
│                                                      │
│ "Add SSH Key" tıkla                                  │
│ (Aşağıda nasıl oluşturulacağını anlatıyorum)        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ NAME                                                 │
│ eticaret-production                                  │
└─────────────────────────────────────────────────────┘
```

4. "Create & Buy Now" tıkla
5. IP adresini not al (örn: `95.216.123.45`)

---

## 5. Sunucuya Bağlanma

### SSH Key Nedir?

Şifre yerine kullanılan dijital anahtar. Daha güvenli.

### Mac'te SSH Key Oluşturma

Terminal aç ve şu komutları yaz:

```bash
# 1. SSH key oluştur
ssh-keygen -t ed25519 -C "senin@email.com"

# Enter'a bas (varsayılan konum için)
# Şifre sor, boş bırakabilirsin veya güçlü şifre gir

# 2. Public key'i görüntüle
cat ~/.ssh/id_ed25519.pub
```

Bu çıktıyı kopyala, şöyle görünür:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGörünmezkarekterler... senin@email.com
```

Bu key'i Hetzner'da "Add SSH Key" kısmına yapıştır.

### Sunucuya Bağlanma

```bash
# Terminal'de yaz:
ssh root@SUNUCU_IP_ADRESI

# Örnek:
ssh root@95.216.123.45

# İlk bağlantıda "yes" yaz ve Enter'a bas
```

✅ Bağlandıysan şöyle bir ekran görürsün:

```
root@eticaret-production:~#
```

---

## 6. Sunucu Kurulumu

Sunucuya bağlandıktan sonra sırasıyla bu komutları çalıştır:

### 6.1 Sistemi Güncelle

```bash
# Paket listesini güncelle
apt update

# Paketleri güncelle
apt upgrade -y
```

### 6.2 Güvenlik için Yeni Kullanıcı Oluştur

```bash
# Yeni kullanıcı oluştur (root kullanma, tehlikeli)
adduser deploy

# Şifre gir (güçlü olsun!)
# Diğer sorulara Enter basabilirsin

# Kullanıcıya sudo yetkisi ver
usermod -aG sudo deploy

# SSH key'i yeni kullanıcıya kopyala
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 6.3 Firewall (Güvenlik Duvarı) Kur

```bash
# UFW'yi aktifleştir
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable          # "y" yaz ve Enter

# Durumu kontrol et
ufw status
```

### 6.4 Docker Kur

```bash
# Docker'ı indir ve kur
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose'u kur
apt install docker-compose-plugin -y

# deploy kullanıcısına Docker izni ver
usermod -aG docker deploy

# Kurulumu doğrula
docker --version
docker compose version
```

### 6.5 Proje Klasörü Oluştur

```bash
# Klasör oluştur
mkdir -p /opt/eticaret

# deploy kullanıcısına sahiplik ver
chown -R deploy:deploy /opt/eticaret

# Backup klasörü
mkdir -p /opt/eticaret/backups
```

### 6.6 Çıkış Yap ve deploy Kullanıcısıyla Bağlan

```bash
# Çık
exit

# Yeni kullanıcıyla bağlan
ssh deploy@SUNUCU_IP_ADRESI
```

---

## 7. Projeyi Yükleme

### Seçenek A: Git ile (Önerilen)

```bash
# Proje klasörüne git
cd /opt/eticaret

# Repository'yi clone'la
git clone https://github.com/BatuhanVarlik/E-Commerce-App.git .

# (Nokta önemli - mevcut klasöre clone'lar)
```

### Seçenek B: Manuel Yükleme (SCP)

Mac'te yeni terminal aç:

```bash
# Tüm projeyi yükle
scp -r /Users/batu/Desktop/Yazılım\ Öğrenme\ serüveni/E-ticaret/* deploy@SUNUCU_IP:/opt/eticaret/
```

### Environment Dosyasını Oluştur

Sunucuda:

```bash
cd /opt/eticaret

# Örnek dosyayı kopyala
cp .env.production.example .env

# Düzenle
nano .env
```

**nano Editör Kullanımı:**

- Ok tuşlarıyla hareket et
- Değerleri değiştir
- `Ctrl + O` → Kaydet (Enter'a bas)
- `Ctrl + X` → Çık

**Değiştirmen gereken değerler:**

```env
# Güçlü şifre oluştur (örnek)
DB_PASSWORD=X7k$mP9@nL2#qR5!vB8&wY4*

# JWT için rastgele string (en az 64 karakter)
# Bu siteyi kullan: https://randomkeygen.com/
JWT_SECRET_KEY=burayaCokUzunRastgelebirStringYaz64telerolsunEnAz

# Redis şifresi
REDIS_PASSWORD=BaskaBirGucluSifre123!@#

# Domain adreslerini güncelle
JWT_ISSUER=https://api.senindomain.com
JWT_AUDIENCE=https://senindomain.com
NEXT_PUBLIC_API_URL=https://api.senindomain.com
NEXT_PUBLIC_SITE_URL=https://senindomain.com
```

### Nginx Konfigürasyonunu Güncelle

```bash
cd /opt/eticaret

# Domain adını değiştir
nano nginx/nginx.conf

# "yourdomain.com" yazan yerleri kendi domain'inle değiştir
# Ctrl+W ile arama yapabilirsin
# Ctrl+O ile kaydet, Ctrl+X ile çık
```

---

## 8. SSL Sertifikası (HTTPS)

### Let's Encrypt ile Ücretsiz SSL

```bash
# Certbot'u kur
sudo apt install certbot -y

# Sertifika al (domain'ini değiştir!)
sudo certbot certonly --standalone \
    -d senindomain.com \
    -d www.senindomain.com \
    -d api.senindomain.com

# Email adresini gir
# "Y" ile kabul et
```

### Sertifikaları Kopyala

```bash
# SSL klasörü oluştur
sudo mkdir -p /opt/eticaret/ssl

# Sertifikaları kopyala
sudo cp /etc/letsencrypt/live/senindomain.com/fullchain.pem /opt/eticaret/ssl/
sudo cp /etc/letsencrypt/live/senindomain.com/privkey.pem /opt/eticaret/ssl/

# İzinleri ayarla
sudo chown -R deploy:deploy /opt/eticaret/ssl
```

### Otomatik Yenileme (Cron)

```bash
# Cron düzenle
crontab -e

# Bu satırı ekle (her Pazar saat 3'te yeniler):
0 3 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/senindomain.com/*.pem /opt/eticaret/ssl/ && docker restart eticaret-nginx
```

---

## 9. Ödeme Sistemi (Iyzico)

### 9.1 Iyzico Hesabı Oluştur

1. [iyzico.com](https://www.iyzico.com) adresine git
2. "Hemen Başla" tıkla
3. Şirket bilgilerini gir (şahıs şirketi de olabilir)
4. Gerekli belgeleri yükle:
   - Vergi levhası
   - İmza sirküleri
   - Kimlik fotokopisi
   - Banka hesap bilgileri

### 9.2 Sandbox (Test) Hesabı

1. [sandbox-merchant.iyzipay.com](https://sandbox-merchant.iyzipay.com) adresine git
2. Test hesabı oluştur
3. API anahtarlarını al:
   - Dashboard → Settings → API Keys
   - API Key ve Secret Key'i kopyala

### 9.3 Production Hesabı

Onay aldıktan sonra (genellikle 2-5 iş günü):

1. [merchant.iyzipay.com](https://merchant.iyzipay.com) adresine git
2. Production API anahtarlarını al
3. `.env` dosyasında güncelle:

```env
IYZICO_API_KEY=production-api-key
IYZICO_SECRET_KEY=production-secret-key
IYZICO_BASE_URL=https://api.iyzipay.com
```

### Test Kartları

Sandbox'ta test için:

```
Kart No: 5528790000000008
SKT: 12/30
CVV: 123
3D Şifre: 283126
```

---

## 10. Email Servisi

### Seçenek A: Gmail SMTP (Başlangıç için)

1. Gmail hesabında 2FA aktifleştir
2. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) adresine git
3. "Uygulama Şifresi" oluştur
4. `.env` dosyasında:

```env
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USERNAME=senin@gmail.com
EMAIL_SMTP_PASSWORD=app-specific-password  # Oluşturduğun şifre
EMAIL_FROM_EMAIL=senin@gmail.com
EMAIL_FROM_NAME=E-Ticaret Mağazası
```

### Seçenek B: Mailgun (Profesyonel)

1. [mailgun.com](https://mailgun.com) hesabı oluştur
2. Domain doğrulama yap
3. SMTP bilgilerini al

---

## 11. Canlıya Alma

### 11.1 Uygulamayı Başlat

```bash
cd /opt/eticaret

# İlk kez çalıştırma (build dahil)
docker compose -f docker-compose.production.yml up -d --build

# Bu komut:
# - Tüm servisleri başlatır
# - Veritabanını oluşturur
# - Uygulamayı ayağa kaldırır
```

### 11.2 Durumu Kontrol Et

```bash
# Tüm container'ları gör
docker compose -f docker-compose.production.yml ps

# Çıktı şöyle olmalı (STATUS = healthy):
# NAME                STATUS
# eticaret-backend    Up (healthy)
# eticaret-frontend   Up (healthy)
# eticaret-nginx      Up (healthy)
# eticaret-postgres   Up (healthy)
# eticaret-redis      Up (healthy)
```

### 11.3 Logları İzle

```bash
# Tüm loglar
docker compose -f docker-compose.production.yml logs -f

# Sadece backend
docker compose -f docker-compose.production.yml logs -f backend

# Çıkmak için Ctrl+C
```

### 11.4 Test Et

```bash
# Health check
curl https://senindomain.com/api/health

# Beklenen yanıt:
# {"status":"healthy","timestamp":"...","service":"ETicaret.API"}
```

### 11.5 Tarayıcıda Kontrol Et

1. `https://senindomain.com` adresine git
2. Anasayfa yüklenmeli
3. Kayıt ol / Giriş yap test et
4. Ürün listele, sepete ekle test et
5. Ödeme sayfasını test et (sandbox'ta)

---

## 12. Bakım ve İzleme

### Günlük Kontroller

```bash
# Servislerin durumu
docker compose -f docker-compose.production.yml ps

# Disk kullanımı
df -h

# Memory kullanımı
free -h
```

### Güncelleme Yapmak

```bash
cd /opt/eticaret

# Yeni kodu çek
git pull origin main

# Servisleri güncelle
docker compose -f docker-compose.production.yml up -d --build

# Eski image'ları temizle
docker system prune -af
```

### Yedekleme

```bash
# Manuel backup
./scripts/backup.sh

# Backup'lar burada:
ls -la /opt/eticaret/backups/
```

### UptimeRobot ile İzleme (Ücretsiz)

1. [uptimerobot.com](https://uptimerobot.com) hesabı oluştur
2. "Add New Monitor" tıkla
3. Ayarlar:
   - Monitor Type: HTTP(s)
   - URL: `https://senindomain.com/api/health`
   - Monitoring Interval: 5 minutes
4. Site düşerse email/SMS uyarısı alırsın

---

## 13. Maliyet Özeti

### Başlangıç Maliyeti

| Kalem                | Fiyat     |
| -------------------- | --------- |
| Domain (.com, 1 yıl) | ~400₺     |
| **Toplam**           | **~400₺** |

### Aylık Maliyet

| Kalem                    | Fiyat        |
| ------------------------ | ------------ |
| Hetzner VPS (CX21)       | ~200₺        |
| SSL Sertifikası          | Ücretsiz     |
| Email (Gmail SMTP)       | Ücretsiz     |
| Monitoring (UptimeRobot) | Ücretsiz     |
| **Toplam**               | **~200₺/ay** |

### Büyüdükten Sonra (Opsiyonel)

| Kalem                 | Fiyat    |
| --------------------- | -------- |
| Daha güçlü VPS (CX31) | ~370₺/ay |
| CDN (Cloudflare Pro)  | ~500₺/ay |
| Email (Mailgun)       | ~100₺/ay |
| Backup (S3)           | ~50₺/ay  |

---

## 14. Sık Sorulan Sorular

### S: Site çöktü, ne yapmalıyım?

```bash
# Sunucuya bağlan
ssh deploy@sunucu-ip

# Servisleri yeniden başlat
cd /opt/eticaret
docker compose -f docker-compose.production.yml restart

# Logları kontrol et
docker compose -f docker-compose.production.yml logs --tail=100
```

### S: Veritabanına nasıl bağlanırım?

```bash
docker compose -f docker-compose.production.yml exec postgres psql -U admin -d eticaret_db
```

### S: Değişiklik yaptım nasıl yayınlarım?

```bash
cd /opt/eticaret
git add .
git commit -m "Değişiklik açıklaması"
git push origin main

# Sunucuda
docker compose -f docker-compose.production.yml up -d --build
```

### S: SSL sertifikası süresi doldu?

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/domain/*.pem /opt/eticaret/ssl/
docker restart eticaret-nginx
```

### S: Disk doluyor?

```bash
# Docker temizliği
docker system prune -af

# Log temizliği
docker compose -f docker-compose.production.yml logs --tail=0

# Eski backup'ları sil
find /opt/eticaret/backups -type f -mtime +7 -delete
```

---

## 📞 Yardım Kaynakları

- **Docker Belgeleri:** [docs.docker.com](https://docs.docker.com)
- **Hetzner Belgeleri:** [docs.hetzner.com](https://docs.hetzner.com)
- **Let's Encrypt:** [letsencrypt.org](https://letsencrypt.org)
- **Iyzico Belgeleri:** [dev.iyzipay.com](https://dev.iyzipay.com)

---

## ✅ Kontrol Listesi

Canlıya almadan önce bu listeyi kontrol et:

- [ ] Domain satın alındı
- [ ] DNS ayarları yapıldı (A kayıtları)
- [ ] Sunucu kiralandı
- [ ] SSH key oluşturuldu
- [ ] Sunucuya bağlanabiliyorum
- [ ] Docker kuruldu
- [ ] Proje yüklendi
- [ ] `.env` dosyası düzenlendi
- [ ] SSL sertifikası alındı
- [ ] Iyzico hesabı onaylandı
- [ ] Email servisi ayarlandı
- [ ] Tüm servisler çalışıyor (`docker ps`)
- [ ] Site tarayıcıda açılıyor
- [ ] HTTPS çalışıyor (kilit işareti var)
- [ ] Kayıt/Giriş çalışıyor
- [ ] Ödeme testi yapıldı
- [ ] Backup cron'u ayarlandı
- [ ] UptimeRobot kuruldu

---

**Başarılar! 🚀**

_Sorun yaşarsan adım adım logları kontrol et ve hata mesajlarını Google'da ara._
