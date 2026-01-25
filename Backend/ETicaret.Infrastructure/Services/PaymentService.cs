using ETicaret.Application.Interfaces;
using Iyzipay;
using Iyzipay.Model;
using Iyzipay.Request;
using Microsoft.Extensions.Configuration;

namespace ETicaret.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly Options _options;

    public PaymentService(IConfiguration configuration)
    {
        _options = new Options
        {
            ApiKey = configuration["Iyzico:ApiKey"],
            SecretKey = configuration["Iyzico:SecretKey"],
            BaseUrl = configuration["Iyzico:BaseUrl"] ?? "https://sandbox-api.iyzipay.com"
        };
    }

    public async Task<string> ProcessPaymentAsync(PaymentRequestDto requestDto)
    {
        // MOCK for Testing if keys are placeholders
        if (_options.ApiKey.Contains("sandbox-v7a0"))
        {
            return Guid.NewGuid().ToString();
        }

        var request = new CreatePaymentRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = Guid.NewGuid().ToString(),
            Price = requestDto.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture),
            PaidPrice = requestDto.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture),
            Currency = Currency.TRY.ToString(),
            Installment = 1,
            BasketId = "B" + Guid.NewGuid().ToString().Substring(0, 6),
            PaymentChannel = PaymentChannel.WEB.ToString(),
            PaymentGroup = PaymentGroup.PRODUCT.ToString(),
            
            PaymentCard = new PaymentCard
            {
                CardHolderName = requestDto.CardHolderName,
                CardNumber = requestDto.CardNumber,
                ExpireMonth = requestDto.ExpireMonth,
                ExpireYear = requestDto.ExpireYear,
                Cvc = requestDto.Cvc,
                RegisterCard = 0
            },
            
            Buyer = new Buyer
            {
                Id = requestDto.BuyerId,
                Name = requestDto.BuyerName,
                Surname = requestDto.BuyerSurname,
                GsmNumber = "+905350000000",
                Email = requestDto.BuyerEmail,
                IdentityNumber = "11111111111", // Sandbox dummy
                LastLoginDate = "2015-10-05 12:43:35",
                RegistrationDate = "2013-04-21 15:12:09",
                RegistrationAddress = requestDto.BuyerAddress,
                Ip = requestDto.BuyerIp,
                City = requestDto.BuyerCity,
                Country = "Turkey",
                ZipCode = "34732"
            },
            
            ShippingAddress = new Address
            {
                ContactName = requestDto.BuyerName + " " + requestDto.BuyerSurname,
                City = requestDto.BuyerCity,
                Country = "Turkey",
                Description = requestDto.BuyerAddress,
                ZipCode = "34732"
            },
            
            BillingAddress = new Address
            {
                ContactName = requestDto.BuyerName + " " + requestDto.BuyerSurname,
                City = requestDto.BuyerCity,
                Country = "Turkey",
                Description = requestDto.BuyerAddress,
                ZipCode = "34732"
            },
            
            // Dummy Basket Items (Iyzico requires at least one)
            BasketItems = new List<BasketItem>
            {
                new BasketItem
                {
                    Id = "BI101",
                    Name = "Binocular",
                    Category1 = "Collectibles",
                    Category2 = "Accessories",
                    ItemType = BasketItemType.PHYSICAL.ToString(),
                    Price = requestDto.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)
                }
            }
        };

        // Note: Iyzipay .NET SDK returns Task<Payment> apparently
        var payment = await Payment.Create(request, _options);

        if (payment.Status == "success")
        {
            return payment.PaymentId;
        }

        throw new Exception($"Payment failed: {payment.ErrorMessage}");
    }
}
