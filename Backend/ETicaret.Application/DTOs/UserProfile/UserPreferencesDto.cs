namespace ETicaret.Application.DTOs.UserProfile;

public class UserPreferencesDto
{
    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
    public bool MarketingEmails { get; set; } = false;
    public bool OrderUpdates { get; set; } = true;
    public bool PriceAlerts { get; set; } = true;
    public bool NewsletterSubscription { get; set; } = false;
}

public class UpdatePreferencesDto
{
    public bool? EmailNotifications { get; set; }
    public bool? SmsNotifications { get; set; }
    public bool? PushNotifications { get; set; }
    public bool? MarketingEmails { get; set; }
    public bool? OrderUpdates { get; set; }
    public bool? PriceAlerts { get; set; }
    public bool? NewsletterSubscription { get; set; }
}
