using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class UserPreferences : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    
    // Notification Settings
    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
    public bool MarketingEmails { get; set; } = false;
    public bool OrderUpdates { get; set; } = true;
    public bool PriceAlerts { get; set; } = true;
    public bool NewsletterSubscription { get; set; } = false;
}
