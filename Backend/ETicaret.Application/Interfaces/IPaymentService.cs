using ETicaret.Application.DTOs.Cart;
using ETicaret.Domain.Entities;

namespace ETicaret.Application.Interfaces;

public interface IPaymentService
{
    // Simplified for now, just takes amount and card info
    Task<string> ProcessPaymentAsync(PaymentRequestDto request);
}

public class PaymentRequestDto
{
    public string CardHolderName { get; set; } = string.Empty;
    public string CardNumber { get; set; } = string.Empty;
    public string ExpireMonth { get; set; } = string.Empty;
    public string ExpireYear { get; set; } = string.Empty;
    public string Cvc { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "TRY";
    
    // Buyer Info (for Iyzico)
    public string BuyerId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerSurname { get; set; } = string.Empty;
    public string BuyerEmail { get; set; } = string.Empty;
    public string BuyerIp { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public string BuyerCity { get; set; } = string.Empty;
}
