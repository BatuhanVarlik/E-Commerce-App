namespace ETicaret.Application.Interfaces;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string email, string userName);
    Task SendOrderConfirmationEmailAsync(string email, string orderNumber, decimal totalAmount);
    Task SendOrderShippedEmailAsync(string email, string orderNumber, string trackingNumber, string shippingCompany);
    Task SendOrderDeliveredEmailAsync(string email, string orderNumber);
    Task SendPasswordResetEmailAsync(string email, string resetToken, string resetUrl);
    Task SendPriceDropAlertAsync(string email, string productName, decimal oldPrice, decimal newPrice, string productUrl);
    Task SendStockAvailableAlertAsync(string email, string productName, string productUrl);
}
