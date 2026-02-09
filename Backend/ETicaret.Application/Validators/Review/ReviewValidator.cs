using FluentValidation;
using ETicaret.Application.DTOs.Review;

namespace ETicaret.Application.Validators.Review;

public class CreateReviewDtoValidator : AbstractValidator<CreateReviewDto>
{
    public CreateReviewDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Ürün ID zorunludur");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Puan 1-5 arasında olmalıdır");

        RuleFor(x => x.Comment)
            .NotEmpty().WithMessage("Yorum zorunludur")
            .MinimumLength(10).WithMessage("Yorum en az 10 karakter olmalıdır")
            .MaximumLength(1000).WithMessage("Yorum en fazla 1000 karakter olabilir");

        RuleFor(x => x.ImageUrl)
            .Must(BeValidUrl).When(x => !string.IsNullOrEmpty(x.ImageUrl))
            .WithMessage("Geçerli bir resim URL'i giriniz");
    }

    private bool BeValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var result) 
               && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}

public class UpdateReviewDtoValidator : AbstractValidator<UpdateReviewDto>
{
    public UpdateReviewDtoValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Puan 1-5 arasında olmalıdır");

        RuleFor(x => x.Comment)
            .NotEmpty().WithMessage("Yorum zorunludur")
            .MinimumLength(10).WithMessage("Yorum en az 10 karakter olmalıdır")
            .MaximumLength(1000).WithMessage("Yorum en fazla 1000 karakter olabilir");
    }
}
