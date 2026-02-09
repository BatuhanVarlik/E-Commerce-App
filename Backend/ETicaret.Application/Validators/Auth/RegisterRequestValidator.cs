using FluentValidation;
using ETicaret.Application.DTOs.Auth;

namespace ETicaret.Application.Validators.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email adresi zorunludur")
            .EmailAddress().WithMessage("Geçerli bir email adresi giriniz")
            .MaximumLength(255).WithMessage("Email adresi en fazla 255 karakter olabilir");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur")
            .MinimumLength(8).WithMessage("Şifre en az 8 karakter olmalıdır")
            .MaximumLength(100).WithMessage("Şifre en fazla 100 karakter olabilir")
            .Matches(@"[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir")
            .Matches(@"[a-z]").WithMessage("Şifre en az bir küçük harf içermelidir")
            .Matches(@"[0-9]").WithMessage("Şifre en az bir rakam içermelidir")
            .Matches(@"[!@#$%^&*(),.?"":{}|<>]").WithMessage("Şifre en az bir özel karakter içermelidir");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Ad zorunludur")
            .MinimumLength(2).WithMessage("Ad en az 2 karakter olmalıdır")
            .MaximumLength(50).WithMessage("Ad en fazla 50 karakter olabilir")
            .Matches(@"^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$").WithMessage("Ad sadece harf içerebilir");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Soyad zorunludur")
            .MinimumLength(2).WithMessage("Soyad en az 2 karakter olmalıdır")
            .MaximumLength(50).WithMessage("Soyad en fazla 50 karakter olabilir")
            .Matches(@"^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$").WithMessage("Soyad sadece harf içerebilir");
    }
}
