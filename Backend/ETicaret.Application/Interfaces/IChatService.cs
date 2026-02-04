using ETicaret.Application.DTOs.Chat;

namespace ETicaret.Application.Interfaces;

public interface IChatService
{
    // Chat Rooms
    Task<ChatRoomDto> CreateChatRoomAsync(string? userId, CreateChatRoomRequest request);
    Task<ChatRoomDto?> GetChatRoomAsync(Guid roomId);
    Task<List<ChatRoomDto>> GetUserChatsAsync(string userId);
    Task<List<ChatRoomDto>> GetAllChatsAsync(string? status = null, string? category = null);
    Task<List<ChatRoomDto>> GetAgentChatsAsync(string agentId);
    Task<ChatRoomDto> UpdateChatRoomAsync(Guid roomId, UpdateChatRoomRequest request);
    Task<bool> AssignAgentAsync(Guid roomId, string agentId);
    Task<bool> CloseChatAsync(Guid roomId, string? closingNote = null);
    Task<bool> RateChatAsync(Guid roomId, int rating);
    
    // Messages
    Task<ChatMessageDto> SendMessageAsync(string? userId, SendMessageRequest request, bool isAdmin = false);
    Task<List<ChatMessageDto>> GetMessagesAsync(Guid roomId, int page = 1, int pageSize = 50);
    Task<bool> MarkAsReadAsync(Guid roomId, string? userId);
    Task<int> GetUnreadCountAsync(Guid roomId, string? userId);
}

public interface IChatbotService
{
    // Bot Responses
    Task<BotQueryResponse> ProcessMessageAsync(string message, Guid? chatRoomId = null);
    Task<ChatbotResponseDto> CreateResponseAsync(CreateChatbotResponseRequest request);
    Task<ChatbotResponseDto?> GetResponseAsync(Guid id);
    Task<List<ChatbotResponseDto>> GetAllResponsesAsync(string? category = null);
    Task<ChatbotResponseDto> UpdateResponseAsync(Guid id, CreateChatbotResponseRequest request);
    Task<bool> DeleteResponseAsync(Guid id);
    
    // Quick Replies
    Task<List<string>> GetQuickRepliesAsync();
    Task<List<string>> GetCategoryQuickRepliesAsync(string category);
}

public interface IChatAgentService
{
    // Agent Management
    Task<ChatAgentDto> GetOrCreateAgentAsync(string userId);
    Task<ChatAgentDto?> GetAgentAsync(Guid agentId);
    Task<List<ChatAgentDto>> GetAllAgentsAsync(bool? onlineOnly = null);
    Task<ChatAgentDto> UpdateAgentStatusAsync(string userId, UpdateAgentStatusRequest request);
    Task<ChatAgentDto?> GetAvailableAgentAsync(string? category = null);
    Task<bool> UpdateAgentStatsAsync(Guid agentId, double responseTime, double? rating = null);
    
    // Stats
    Task<ChatStatsDto> GetChatStatsAsync();
}
