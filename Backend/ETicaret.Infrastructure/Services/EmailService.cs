using ETicaret.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace ETicaret.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _smtpUsername;
    private readonly string _smtpPassword;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        _smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
        var portStr = _configuration["Email:SmtpPort"];
        _smtpPort = !string.IsNullOrEmpty(portStr) && int.TryParse(portStr, out var port) ? port : 587;
        _smtpUsername = _configuration["Email:SmtpUsername"] ?? "";
        _smtpPassword = _configuration["Email:SmtpPassword"] ?? "";
        _fromEmail = _configuration["Email:FromEmail"] ?? "";
        _fromName = _configuration["Email:FromName"] ?? "E-Ticaret";
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            using var smtpClient = new SmtpClient(_smtpHost, _smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_smtpUsername, _smtpPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
                BodyEncoding = Encoding.UTF8
            };

            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }

    public async Task SendWelcomeEmailAsync(string email, string userName)
    {
        var subject = "Hoş Geldiniz! 🎉";
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Hoş Geldiniz!</h1>
                    </div>
                    <div class='content'>
                        <p>Merhaba <strong>{userName}</strong>,</p>
                        <p>E-Ticaret platformumuza katıldığınız için teşekkür ederiz! 🎊</p>
                        <p>Sizin için özel fırsatlar ve kampanyalar hazırladık. Hemen alışverişe başlayabilirsiniz.</p>
                        <a href='https://yourwebsite.com/products' class='button'>Alışverişe Başla</a>
                        <p>İyi alışverişler dileriz!</p>
                    </div>
                    <div class='footer'>
                        <p>Bu email otomatik olarak gönderilmiştir.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendOrderConfirmationEmailAsync(string email, string orderNumber, decimal totalAmount)
    {
        var subject = $"Siparişiniz Alındı - #{orderNumber}";
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .order-box {{ background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✓ Siparişiniz Alındı</h1>
                    </div>
                    <div class='content'>
                        <p>Siparişiniz başarıyla alındı ve işleme konuldu.</p>
                        <div class='order-box'>
                            <h3>Sipariş Detayları</h3>
                            <p><strong>Sipariş No:</strong> {orderNumber}</p>
                            <p><strong>Toplam Tutar:</strong> {totalAmount:N2} ₺</p>
                        </div>
                        <p>Siparişiniz hazırlanıp kargoya verildiğinde bilgilendirileceksiniz.</p>
                        <a href='https://yourwebsite.com/profile/orders' class='button'>Siparişimi Görüntüle</a>
                    </div>
                    <div class='footer'>
                        <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendOrderShippedEmailAsync(string email, string orderNumber, string trackingNumber, string shippingCompany)
    {
        var subject = $"Siparişiniz Kargoya Verildi - #{orderNumber}";
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .tracking-box {{ background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }}
                    .tracking-number {{ font-size: 24px; color: #3b82f6; font-weight: bold; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🚚 Siparişiniz Kargoda!</h1>
                    </div>
                    <div class='content'>
                        <p>Siparişiniz kargoya verildi ve yolda!</p>
                        <div class='tracking-box'>
                            <h3>Kargo Bilgileri</h3>
                            <p><strong>Sipariş No:</strong> {orderNumber}</p>
                            <p><strong>Kargo Firması:</strong> {shippingCompany}</p>
                            <p><strong>Takip Numarası:</strong></p>
                            <p class='tracking-number'>{trackingNumber}</p>
                        </div>
                        <p>Kargonuzu takip numarası ile takip edebilirsiniz.</p>
                        <a href='https://yourwebsite.com/track?number={trackingNumber}' class='button'>Kargomu Takip Et</a>
                    </div>
                    <div class='footer'>
                        <p>Tahmini teslimat süresi 2-3 iş günüdür.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendOrderDeliveredEmailAsync(string email, string orderNumber)
    {
        var subject = $"Siparişiniz Teslim Edildi - #{orderNumber}";
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>📦 Siparişiniz Teslim Edildi!</h1>
                    </div>
                    <div class='content'>
                        <p>Siparişiniz başarıyla teslim edildi.</p>
                        <p><strong>Sipariş No:</strong> {orderNumber}</p>
                        <p>Ürünlerimizden memnun kaldıysanız, lütfen değerlendirme yapmayı unutmayın!</p>
                        <a href='https://yourwebsite.com/profile/orders/{orderNumber}' class='button'>Değerlendirme Yap</a>
                        <p>Alışverişiniz için teşekkür ederiz. 💚</p>
                    </div>
                    <div class='footer'>
                        <p>Bir problem mi var? Bize ulaşın!</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendPasswordResetEmailAsync(string email, string resetToken, string resetUrl)
    {
        var subject = "Şifre Sıfırlama Talebi";
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .warning {{ background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🔐 Şifre Sıfırlama</h1>
                    </div>
                    <div class='content'>
                        <p>Şifrenizi sıfırlamak için bir talepte bulundunuz.</p>
                        <p>Aşağıdaki butona tıklayarak yeni şifrenizi oluşturabilirsiniz:</p>
                        <a href='{resetUrl}' class='button'>Şifremi Sıfırla</a>
                        <div class='warning'>
                            <strong>⚠️ Güvenlik Uyarısı:</strong><br>
                            Bu talebi siz yapmadıysanız, lütfen bu emaili görmezden gelin ve şifrenizi değiştirin.
                        </div>
                        <p>Bu link 1 saat geçerlidir.</p>
                    </div>
                    <div class='footer'>
                        <p>Şifrenizi kimseyle paylaşmayın.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendPriceDropAlertAsync(string email, string productName, decimal oldPrice, decimal newPrice, string productUrl)
    {
        var subject = $"🔔 Fiyat Düştü: {productName}";
        var discount = ((oldPrice - newPrice) / oldPrice) * 100;
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .price-box {{ background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }}
                    .old-price {{ text-decoration: line-through; color: #999; font-size: 18px; }}
                    .new-price {{ color: #10b981; font-size: 32px; font-weight: bold; }}
                    .discount {{ background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 10px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>💰 Fiyat Düştü!</h1>
                    </div>
                    <div class='content'>
                        <p>Takip ettiğiniz üründe fiyat düşüşü var!</p>
                        <h3>{productName}</h3>
                        <div class='price-box'>
                            <p class='old-price'>{oldPrice:N2} ₺</p>
                            <p class='new-price'>{newPrice:N2} ₺</p>
                            <span class='discount'>%{discount:N0} İndirim!</span>
                        </div>
                        <p>Bu fırsatı kaçırmayın!</p>
                        <a href='{productUrl}' class='button'>Hemen Al</a>
                    </div>
                    <div class='footer'>
                        <p>Fiyatlar stok durumuna göre değişiklik gösterebilir.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendStockAvailableAlertAsync(string email, string productName, string productUrl)
    {
        var subject = $"✅ Ürün Stoğa Geldi: {productName}";
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .alert-box {{ background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🎉 Stoğa Geldi!</h1>
                    </div>
                    <div class='content'>
                        <p>Beklediğiniz ürün stoğa geldi!</p>
                        <div class='alert-box'>
                            <h3>{productName}</h3>
                            <p>Artık satın alabilirsiniz. Acele edin, stoklar tükenebilir!</p>
                        </div>
                        <a href='{productUrl}' class='button'>Hemen Satın Al</a>
                    </div>
                    <div class='footer'>
                        <p>Stok bildirimi almak istemeyen bu emaildeki linke tıklayın.</p>
                    </div>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }
}
