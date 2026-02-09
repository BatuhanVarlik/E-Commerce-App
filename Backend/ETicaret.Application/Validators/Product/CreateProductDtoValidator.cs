using FluentValidation;
using ETicaret.Application.DTOs.Product;

namespace ETicaret.Application.Validators.Product;

public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ürün adı zorunludur")
            .MinimumLength(3).WithMessage("Ürün adı en az 3 karakter olmalıdır")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Ürün açıklaması zorunludur")
            .MinimumLength(10).WithMessage("Ürün açıklaması en az 10 karakter olmalıdır")
            .MaximumLength(5000).WithMessage("Ürün açıklaması en fazla 5000 karakter olabilir");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Fiyat 0'dan büyük olmalıdır")
            .LessThanOrEqualTo(1000000).WithMessage("Fiyat 1.000.000 TL'den fazla olamaz");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stok negatif olamaz")
            .LessThanOrEqualTo(100000).WithMessage("Stok 100.000'den fazla olamaz");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Kategori seçimi zorunludur");

        RuleFor(x => x.BrandId)
            .NotEmpty().WithMessage("Marka seçimi zorunludur");
    }
}
