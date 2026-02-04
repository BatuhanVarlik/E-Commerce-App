using System.ComponentModel.DataAnnotations;

namespace ETicaret.Domain.Entities;

// Chat Room/Conversation
public class ChatRoom
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Müşteri
    public string? UserId { get; set; }
    public virtual User? User { get; set; }
    
    // Guest support (login olmadan)
    public string? GuestEmail { get; set; }
    public string? GuestName { get; set; }
    public string? SessionId { get; set; }
    
    // Admin/Destek temsilcisi
    public string? AssignedToId { get; set; }
    public virtual User? AssignedTo { get; set; }
    
    // Status
    public ChatRoomStatus Status { get; set; } = ChatRoomStatus.Waiting;
    public ChatPriority Priority { get; set; } = ChatPriority.Normal;
    public string? Subject { get; set; }
    public string? Category { get; set; } // Order, Product, Return, Payment, General
    
    // Related entities
    public Guid? RelatedOrderId { get; set; }
    public Guid? RelatedProductId { get; set; }
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AssignedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    
    // Metrics
    public int MessageCount { get; set; }
    public int? SatisfactionRating { get; set; } // 1-5
    public string? ClosingNote { get; set; }
    
    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

public enum ChatRoomStatus
{
    Waiting = 0,      // Admin bekleniyor
    Active = 1,       // Görüşme aktif
    OnHold = 2,       // Beklemede
    Resolved = 3,     // Çözüldü
    Closed = 4        // Kapatıldı
}

public enum ChatPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3
}

// Chat Message
public class ChatMessage
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ChatRoomId { get; set; }
    public virtual ChatRoom ChatRoom { get; set; } = null!;
    
    // Sender
    public string? SenderId { get; set; } // null = system/bot
    public virtual User? Sender { get; set; }
    public bool IsFromAdmin { get; set; }
    public bool IsFromBot { get; set; }
    
    // Content
    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; } = MessageType.Text;
    
    // Attachment
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public long? AttachmentSize { get; set; }
    public string? AttachmentType { get; set; } // image/jpeg, application/pdf, etc.
    
    // Status
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum MessageType
{
    Text = 0,
    Image = 1,
    File = 2,
    System = 3,    // "Admin joined", "Chat closed", etc.
    BotResponse = 4
}

// Chatbot FAQ/Responses
public class ChatbotResponse
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(500)]
    public string Question { get; set; } = string.Empty;
    
    // Keywords for matching
    [Required]
    public string Keywords { get; set; } = string.Empty; // JSON array
    
    [Required]
    public string Answer { get; set; } = string.Empty;
    
    public string? Category { get; set; } // Order, Product, Return, Payment, Shipping
    
    // Quick replies/actions
    public string? QuickReplies { get; set; } // JSON array
    public string? ActionType { get; set; } // order_track, product_search, contact_human
    public string? ActionData { get; set; } // JSON
    
    public int Priority { get; set; } // Higher = matched first
    public bool IsActive { get; set; } = true;
    public int HitCount { get; set; } // Usage tracking
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// Agent/Admin availability and stats
public class ChatAgent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string UserId { get; set; } = string.Empty;
    public virtual User User { get; set; } = null!;
    
    public bool IsAvailable { get; set; }
    public bool IsOnline { get; set; }
    
    // Stats
    public int ActiveChats { get; set; }
    public int MaxConcurrentChats { get; set; } = 5;
    public int TotalChatsHandled { get; set; }
    public double AverageResponseTime { get; set; } // seconds
    public double AverageRating { get; set; }
    
    // Specializations
    public string? Specializations { get; set; } // JSON array: ["Order", "Return", "Technical"]
    
    public DateTime? LastActiveAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Chat Settings
public static class ChatSettings
{
    public const int MaxMessageLength = 2000;
    public const int MaxAttachmentSizeMB = 10;
    public const string AllowedAttachmentTypes = ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt";
    public const int BotResponseDelayMs = 500;
    public const int AutoCloseInactiveHours = 24;
    public const int MaxActiveChatPerUser = 3;
    
    public static readonly string[] DefaultQuickReplies = new[]
    {
        "Siparişim nerede?",
        "İade yapmak istiyorum",
        "Ödeme sorunu yaşıyorum",
        "Yetkiliyle görüşmek istiyorum"
    };
    
    public static readonly Dictionary<string, string> SystemMessages = new()
    {
        { "admin_joined", "{0} görüşmeye katıldı." },
        { "admin_left", "{0} görüşmeden ayrıldı." },
        { "chat_closed", "Görüşme kapatıldı. Memnuniyetinizi puanlayın!" },
        { "chat_transferred", "Görüşme {0} adlı yetkiliye aktarıldı." },
        { "bot_greeting", "Merhaba! Ben E-Ticaret Asistan. Size nasıl yardımcı olabilirim?" },
        { "waiting_agent", "Şu anda tüm temsilcilerimiz meşgul. En kısa sürede size dönüş yapacağız." },
        { "agent_available", "Bir temsilci sizinle ilgilenmeye hazır!" }
    };
}
