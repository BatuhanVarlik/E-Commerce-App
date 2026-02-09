using FluentValidation;
using ETicaret.Application.DTOs.Address;

namespace ETicaret.Application.Validators.Address;

public class CreateAddressDtoValidator : AbstractValidator<CreateAddressDto>
{
    public CreateAddressDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Adres başlığı zorunludur")
            .MaximumLength(50).WithMessage("Adres başlığı en fazla 50 karakter olabilir");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Ad Soyad zorunludur")
            .MinimumLength(3).WithMessage("Ad Soyad en az 3 karakter olmalıdır")
            .MaximumLength(100).WithMessage("Ad Soyad en fazla 100 karakter olabilir");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Telefon numarası zorunludur")
            .Matches(@"^(\+90|0)?[0-9]{10}$").WithMessage("Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX)");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Şehir zorunludur")
            .MaximumLength(50).WithMessage("Şehir en fazla 50 karakter olabilir");

        RuleFor(x => x.District)
            .NotEmpty().WithMessage("İlçe zorunludur")
            .MaximumLength(50).WithMessage("İlçe en fazla 50 karakter olabilir");

        RuleFor(x => x.Neighborhood)
            .NotEmpty().WithMessage("Mahalle zorunludur")
            .MaximumLength(100).WithMessage("Mahalle en fazla 100 karakter olabilir");

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("Sokak/Cadde zorunludur")
            .MaximumLength(200).WithMessage("Sokak/Cadde en fazla 200 karakter olabilir");

        RuleFor(x => x.BuildingNo)
            .NotEmpty().WithMessage("Bina no zorunludur")
            .MaximumLength(20).WithMessage("Bina no en fazla 20 karakter olabilir");

        RuleFor(x => x.ApartmentNo)
            .MaximumLength(20).WithMessage("Daire no en fazla 20 karakter olabilir");

        RuleFor(x => x.PostalCode)
            .NotEmpty().WithMessage("Posta kodu zorunludur")
            .Matches(@"^[0-9]{5}$").WithMessage("Posta kodu 5 haneli olmalıdır");

        RuleFor(x => x.Type)
            .InclusiveBetween(0, 2).WithMessage("Geçersiz adres tipi");
    }
}

public class UpdateAddressDtoValidator : AbstractValidator<UpdateAddressDto>
{
    public UpdateAddressDtoValidator()
    {
        Include(new CreateAddressDtoValidator());
    }
}
