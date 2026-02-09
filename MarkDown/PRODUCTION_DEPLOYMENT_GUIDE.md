# 🚀 E-Ticaret Production Deployment Guide

Bu rehber, E-Ticaret projesinin canlıya alınması için adım adım talimatları içerir.

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri

- **OS:** Ubuntu 22.04 LTS (önerilen)
- **RAM:** Minimum 4GB, Önerilen 8GB
- **CPU:** 2+ vCPU
- **Disk:** 50GB+ SSD
- **Docker:** 24.0+
- **Docker Compose:** 2.20+

### Yerel Gereksinimler

- Git
- SSH erişimi

## 🛠️ Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sunucuya bağlan
ssh user@your-server-ip

# Sistem güncelle
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose kurulumu
sudo apt install docker-compose-plugin -y

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker $USER
newgrp docker

# Proje klasörü oluştur
sudo mkdir -p /opt/eticaret
sudo chown -R $USER:$USER /opt/eticaret
```

### 2. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install certbot -y

# Sertifika al (domain'inizi değiştirin)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Sertifikaları kopyala
sudo mkdir -p /opt/eticaret/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/eticaret/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/eticaret/ssl/
sudo chown -R $USER:$USER /opt/eticaret/ssl
```

### 3. Proje Dosyalarını Yükle

```bash
cd /opt/eticaret

# Git ile clone (önerilen)
git clone https://github.com/yourusername/eticaret.git .

# veya SCP ile dosya transferi
# scp -r ./project/* user@server:/opt/eticaret/
```

### 4. Environment Variables Ayarla

```bash
# Production environment dosyası oluştur
cp .env.production.example .env

# Düzenle ve gerçek değerleri gir
nano .env
```

**Önemli ayarlar:**

- `DB_PASSWORD`: Güçlü bir şifre (32+ karakter)
- `JWT_SECRET_KEY`: Rastgele string (64+ karakter)
- `REDIS_PASSWORD`: Güçlü bir şifre
- `IYZICO_*`: Production API anahtarları
- `EMAIL_*`: SMTP bilgileri

### 5. Nginx Konfigürasyonunu Güncelle

```bash
# Domain adını değiştir
sed -i 's/yourdomain.com/GERÇEK_DOMAIN/g' nginx/nginx.conf
```

### 6. Uygulamayı Başlat

```bash
# Build ve başlat
docker compose -f docker-compose.production.yml up -d --build

# Logları kontrol et
docker compose -f docker-compose.production.yml logs -f

# Sağlık durumunu kontrol et
curl http://localhost/api/health
```

## 🔄 Güncelleme Prosedürü

```bash
cd /opt/eticaret

# Yeni değişiklikleri çek
git pull origin main

# Servisleri güncelle
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d --build

# Eski image'ları temizle
docker system prune -af
```

## 💾 Backup & Restore

### Manuel Backup

```bash
# Backup script'i çalıştır
./scripts/backup.sh
```

### Otomatik Backup (Cron)

```bash
# Crontab düzenle
crontab -e

# Her gün saat 02:00'de backup al
0 2 * * * /opt/eticaret/scripts/backup.sh >> /var/log/eticaret-backup.log 2>&1
```

### Restore

```bash
# Database restore
./scripts/backup.sh restore-db /opt/eticaret/backups/database/db_YYYYMMDD_HHMMSS.sql.gz

# Uploads restore
./scripts/backup.sh restore-uploads /opt/eticaret/backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz
```

## 📊 Monitoring

### Sağlık Kontrolü

```bash
# Temel sağlık kontrolü
curl https://yourdomain.com/api/health

# Detaylı sağlık kontrolü
curl https://yourdomain.com/api/health/detailed

# Container durumları
docker compose -f docker-compose.production.yml ps
```

### Loglar

```bash
# Tüm loglar
docker compose -f docker-compose.production.yml logs -f

# Sadece backend logları
docker compose -f docker-compose.production.yml logs -f backend

# Sadece nginx logları
docker compose -f docker-compose.production.yml logs -f nginx
```

## 🔒 Güvenlik Kontrol Listesi

- [ ] SSL sertifikası kuruldu
- [ ] Güçlü şifreler kullanıldı
- [ ] Firewall yapılandırıldı (UFW)
- [ ] SSH key-based authentication aktif
- [ ] .env dosyası git'e eklenmedi
- [ ] Rate limiting aktif
- [ ] CORS sadece production domain için yapılandırıldı
- [ ] Database sadece internal network'ten erişilebilir

### Firewall Ayarları (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 🆘 Sorun Giderme

### Container başlamıyor

```bash
# Logları kontrol et
docker compose -f docker-compose.production.yml logs backend

# Container'ı yeniden oluştur
docker compose -f docker-compose.production.yml up -d --build --force-recreate backend
```

### Database bağlantı hatası

```bash
# PostgreSQL durumunu kontrol et
docker compose -f docker-compose.production.yml exec postgres pg_isready

# Bağlantıyı test et
docker compose -f docker-compose.production.yml exec backend \
  dotnet ef database update
```

### SSL sertifika yenileme

```bash
# Manuel yenileme
sudo certbot renew

# Sertifikaları kopyala
sudo cp /etc/letsencrypt/live/yourdomain.com/*.pem /opt/eticaret/ssl/

# Nginx'i yeniden başlat
docker compose -f docker-compose.production.yml restart nginx
```

## 📞 Destek

Sorunlar için GitHub Issues kullanın veya iletişime geçin.

---

_Son güncelleme: 4 Şubat 2026_
