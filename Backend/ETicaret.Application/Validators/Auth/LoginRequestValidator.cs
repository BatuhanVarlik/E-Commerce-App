using FluentValidation;
using ETicaret.Application.DTOs.Auth;

namespace ETicaret.Application.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email adresi zorunludur")
            .EmailAddress().WithMessage("Geçerli bir email adresi giriniz");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Şifre zorunludur");
    }
}
