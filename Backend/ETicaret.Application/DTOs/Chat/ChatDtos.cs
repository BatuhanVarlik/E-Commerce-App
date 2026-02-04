namespace ETicaret.Application.DTOs.Chat;

// Chat Room DTOs
public class ChatRoomDto
{
    public Guid Id { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestName { get; set; }
    public string? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Category { get; set; }
    public Guid? RelatedOrderId { get; set; }
    public Guid? RelatedProductId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int MessageCount { get; set; }
    public int? SatisfactionRating { get; set; }
    public ChatMessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
}

public class CreateChatRoomRequest
{
    public string? Subject { get; set; }
    public string? Category { get; set; }
    public string? GuestEmail { get; set; }
    public string? GuestName { get; set; }
    public Guid? RelatedOrderId { get; set; }
    public Guid? RelatedProductId { get; set; }
    public string? InitialMessage { get; set; }
}

public class UpdateChatRoomRequest
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? AssignedToId { get; set; }
    public string? ClosingNote { get; set; }
    public int? SatisfactionRating { get; set; }
}

// Chat Message DTOs
public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid ChatRoomId { get; set; }
    public string? SenderId { get; set; }
    public string? SenderName { get; set; }
    public string? SenderAvatar { get; set; }
    public bool IsFromAdmin { get; set; }
    public bool IsFromBot { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public long? AttachmentSize { get; set; }
    public string? AttachmentType { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendMessageRequest
{
    public Guid ChatRoomId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public long? AttachmentSize { get; set; }
    public string? AttachmentType { get; set; }
}

// Chatbot DTOs
public class ChatbotResponseDto
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Keywords { get; set; } = new();
    public string Answer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public List<string>? QuickReplies { get; set; }
    public string? ActionType { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; }
    public int HitCount { get; set; }
}

public class CreateChatbotResponseRequest
{
    public string Question { get; set; } = string.Empty;
    public List<string> Keywords { get; set; } = new();
    public string Answer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public List<string>? QuickReplies { get; set; }
    public string? ActionType { get; set; }
    public string? ActionData { get; set; }
    public int Priority { get; set; }
}

public class BotQueryRequest
{
    public string Message { get; set; } = string.Empty;
    public Guid? ChatRoomId { get; set; }
}

public class BotQueryResponse
{
    public bool Found { get; set; }
    public string? Answer { get; set; }
    public List<string>? QuickReplies { get; set; }
    public string? ActionType { get; set; }
    public string? ActionData { get; set; }
    public bool ShouldEscalate { get; set; }
}

// Chat Agent DTOs
public class ChatAgentDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? UserEmail { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsOnline { get; set; }
    public int ActiveChats { get; set; }
    public int MaxConcurrentChats { get; set; }
    public int TotalChatsHandled { get; set; }
    public double AverageResponseTime { get; set; }
    public double AverageRating { get; set; }
    public List<string>? Specializations { get; set; }
    public DateTime? LastActiveAt { get; set; }
}

public class UpdateAgentStatusRequest
{
    public bool? IsAvailable { get; set; }
    public bool? IsOnline { get; set; }
    public int? MaxConcurrentChats { get; set; }
    public List<string>? Specializations { get; set; }
}

// Stats & Analytics
public class ChatStatsDto
{
    public int TotalChats { get; set; }
    public int ActiveChats { get; set; }
    public int WaitingChats { get; set; }
    public int ResolvedToday { get; set; }
    public double AverageWaitTime { get; set; }
    public double AverageResponseTime { get; set; }
    public double AverageSatisfaction { get; set; }
    public Dictionary<string, int> ChatsByCategory { get; set; } = new();
    public Dictionary<string, int> ChatsByStatus { get; set; } = new();
    public List<ChatAgentDto> OnlineAgents { get; set; } = new();
}

// Real-time Events (SignalR)
public class ChatEvent
{
    public string Type { get; set; } = string.Empty; // message, typing, read, status_change
    public Guid ChatRoomId { get; set; }
    public object? Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class TypingIndicator
{
    public Guid ChatRoomId { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public bool IsTyping { get; set; }
}
