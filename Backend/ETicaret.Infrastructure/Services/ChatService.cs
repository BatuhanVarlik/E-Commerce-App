using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ETicaret.Application.DTOs.Chat;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;

namespace ETicaret.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly ApplicationDbContext _context;

    public ChatService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatRoomDto> CreateChatRoomAsync(string? userId, CreateChatRoomRequest request)
    {
        var room = new ChatRoom
        {
            UserId = userId,
            GuestEmail = request.GuestEmail,
            GuestName = request.GuestName,
            Subject = request.Subject,
            Category = request.Category,
            RelatedOrderId = request.RelatedOrderId,
            RelatedProductId = request.RelatedProductId,
            Status = ChatRoomStatus.Waiting
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        // Add initial message if provided
        if (!string.IsNullOrEmpty(request.InitialMessage))
        {
            var message = new ChatMessage
            {
                ChatRoomId = room.Id,
                SenderId = userId,
                Content = request.InitialMessage,
                Type = MessageType.Text
            };
            _context.ChatMessages.Add(message);
            
            room.MessageCount = 1;
            room.LastMessageAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // Add bot greeting
        var botGreeting = new ChatMessage
        {
            ChatRoomId = room.Id,
            IsFromBot = true,
            Content = ChatSettings.SystemMessages["bot_greeting"],
            Type = MessageType.BotResponse
        };
        _context.ChatMessages.Add(botGreeting);
        await _context.SaveChangesAsync();

        return await GetChatRoomAsync(room.Id) ?? throw new Exception("Chat room creation failed");
    }

    public async Task<ChatRoomDto?> GetChatRoomAsync(Guid roomId)
    {
        var room = await _context.ChatRooms
            .Include(r => r.User)
            .Include(r => r.AssignedTo)
            .Include(r => r.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null) return null;

        return MapToDto(room);
    }

    public async Task<List<ChatRoomDto>> GetUserChatsAsync(string userId)
    {
        var rooms = await _context.ChatRooms
            .Include(r => r.User)
            .Include(r => r.AssignedTo)
            .Include(r => r.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.LastMessageAt ?? r.CreatedAt)
            .ToListAsync();

        return rooms.Select(MapToDto).ToList();
    }

    public async Task<List<ChatRoomDto>> GetAllChatsAsync(string? status = null, string? category = null)
    {
        var query = _context.ChatRooms
            .Include(r => r.User)
            .Include(r => r.AssignedTo)
            .Include(r => r.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ChatRoomStatus>(status, true, out var statusEnum))
        {
            query = query.Where(r => r.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(r => r.Category == category);
        }

        var rooms = await query
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => r.LastMessageAt ?? r.CreatedAt)
            .ToListAsync();

        return rooms.Select(MapToDto).ToList();
    }

    public async Task<List<ChatRoomDto>> GetAgentChatsAsync(string agentId)
    {
        var rooms = await _context.ChatRooms
            .Include(r => r.User)
            .Include(r => r.AssignedTo)
            .Include(r => r.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(r => r.AssignedToId == agentId && r.Status != ChatRoomStatus.Closed)
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => r.LastMessageAt ?? r.CreatedAt)
            .ToListAsync();

        return rooms.Select(MapToDto).ToList();
    }

    public async Task<ChatRoomDto> UpdateChatRoomAsync(Guid roomId, UpdateChatRoomRequest request)
    {
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null) throw new KeyNotFoundException("Chat room not found");

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ChatRoomStatus>(request.Status, true, out var status))
        {
            room.Status = status;
            if (status == ChatRoomStatus.Closed)
            {
                room.ClosedAt = DateTime.UtcNow;
            }
        }

        if (!string.IsNullOrEmpty(request.Priority) && Enum.TryParse<ChatPriority>(request.Priority, true, out var priority))
        {
            room.Priority = priority;
        }

        if (!string.IsNullOrEmpty(request.AssignedToId))
        {
            room.AssignedToId = request.AssignedToId;
            room.AssignedAt = DateTime.UtcNow;
            room.Status = ChatRoomStatus.Active;
        }

        if (request.SatisfactionRating.HasValue)
        {
            room.SatisfactionRating = request.SatisfactionRating;
        }

        if (!string.IsNullOrEmpty(request.ClosingNote))
        {
            room.ClosingNote = request.ClosingNote;
        }

        await _context.SaveChangesAsync();
        return await GetChatRoomAsync(roomId) ?? throw new Exception("Update failed");
    }

    public async Task<bool> AssignAgentAsync(Guid roomId, string agentId)
    {
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null) return false;

        var agent = await _context.ChatAgents.FirstOrDefaultAsync(a => a.UserId == agentId);
        if (agent == null) return false;

        room.AssignedToId = agentId;
        room.AssignedAt = DateTime.UtcNow;
        room.Status = ChatRoomStatus.Active;
        
        agent.ActiveChats++;

        // Add system message
        var user = await _context.Users.FindAsync(agentId);
        var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Temsilci";
        var systemMessage = new ChatMessage
        {
            ChatRoomId = roomId,
            Content = string.Format(ChatSettings.SystemMessages["admin_joined"], userName),
            Type = MessageType.System
        };
        _context.ChatMessages.Add(systemMessage);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CloseChatAsync(Guid roomId, string? closingNote = null)
    {
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null) return false;

        room.Status = ChatRoomStatus.Closed;
        room.ClosedAt = DateTime.UtcNow;
        room.ClosingNote = closingNote;

        if (!string.IsNullOrEmpty(room.AssignedToId))
        {
            var agent = await _context.ChatAgents.FirstOrDefaultAsync(a => a.UserId == room.AssignedToId);
            if (agent != null)
            {
                agent.ActiveChats = Math.Max(0, agent.ActiveChats - 1);
                agent.TotalChatsHandled++;
            }
        }

        // Add system message
        var systemMessage = new ChatMessage
        {
            ChatRoomId = roomId,
            Content = ChatSettings.SystemMessages["chat_closed"],
            Type = MessageType.System
        };
        _context.ChatMessages.Add(systemMessage);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RateChatAsync(Guid roomId, int rating)
    {
        if (rating < 1 || rating > 5) return false;

        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null) return false;

        room.SatisfactionRating = rating;

        if (!string.IsNullOrEmpty(room.AssignedToId))
        {
            var agent = await _context.ChatAgents.FirstOrDefaultAsync(a => a.UserId == room.AssignedToId);
            if (agent != null)
            {
                // Update average rating
                var totalRatings = await _context.ChatRooms
                    .Where(r => r.AssignedToId == agent.UserId && r.SatisfactionRating.HasValue)
                    .CountAsync();
                
                agent.AverageRating = ((agent.AverageRating * (totalRatings - 1)) + rating) / totalRatings;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    // Messages
    public async Task<ChatMessageDto> SendMessageAsync(string? userId, SendMessageRequest request, bool isAdmin = false)
    {
        var room = await _context.ChatRooms.FindAsync(request.ChatRoomId);
        if (room == null) throw new KeyNotFoundException("Chat room not found");

        var messageType = MessageType.Text;
        if (!string.IsNullOrEmpty(request.AttachmentUrl))
        {
            messageType = request.AttachmentType?.StartsWith("image/") == true 
                ? MessageType.Image 
                : MessageType.File;
        }

        var message = new ChatMessage
        {
            ChatRoomId = request.ChatRoomId,
            SenderId = userId,
            Content = request.Content,
            Type = messageType,
            IsFromAdmin = isAdmin,
            AttachmentUrl = request.AttachmentUrl,
            AttachmentName = request.AttachmentName,
            AttachmentSize = request.AttachmentSize,
            AttachmentType = request.AttachmentType
        };

        _context.ChatMessages.Add(message);
        
        room.MessageCount++;
        room.LastMessageAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var sender = !string.IsNullOrEmpty(userId) ? await _context.Users.FindAsync(userId) : null;
        var senderName = sender != null ? $"{sender.FirstName} {sender.LastName}".Trim() : null;
        
        return new ChatMessageDto
        {
            Id = message.Id,
            ChatRoomId = message.ChatRoomId,
            SenderId = message.SenderId,
            SenderName = senderName,
            IsFromAdmin = message.IsFromAdmin,
            IsFromBot = message.IsFromBot,
            Content = message.Content,
            Type = message.Type.ToString(),
            AttachmentUrl = message.AttachmentUrl,
            AttachmentName = message.AttachmentName,
            AttachmentSize = message.AttachmentSize,
            AttachmentType = message.AttachmentType,
            IsRead = message.IsRead,
            CreatedAt = message.CreatedAt
        };
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(Guid roomId, int page = 1, int pageSize = 50)
    {
        var messages = await _context.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.ChatRoomId == roomId && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return messages.Select(m => new ChatMessageDto
        {
            Id = m.Id,
            ChatRoomId = m.ChatRoomId,
            SenderId = m.SenderId,
            SenderName = m.Sender != null ? $"{m.Sender.FirstName} {m.Sender.LastName}".Trim() : null,
            IsFromAdmin = m.IsFromAdmin,
            IsFromBot = m.IsFromBot,
            Content = m.Content,
            Type = m.Type.ToString(),
            AttachmentUrl = m.AttachmentUrl,
            AttachmentName = m.AttachmentName,
            AttachmentSize = m.AttachmentSize,
            AttachmentType = m.AttachmentType,
            IsRead = m.IsRead,
            ReadAt = m.ReadAt,
            CreatedAt = m.CreatedAt
        }).Reverse().ToList();
    }

    public async Task<bool> MarkAsReadAsync(Guid roomId, string? userId)
    {
        var messages = await _context.ChatMessages
            .Where(m => m.ChatRoomId == roomId && !m.IsRead && m.SenderId != userId)
            .ToListAsync();

        foreach (var message in messages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadCountAsync(Guid roomId, string? userId)
    {
        return await _context.ChatMessages
            .Where(m => m.ChatRoomId == roomId && !m.IsRead && m.SenderId != userId)
            .CountAsync();
    }

    private ChatRoomDto MapToDto(ChatRoom room)
    {
        var lastMessage = room.Messages.FirstOrDefault();
        
        return new ChatRoomDto
        {
            Id = room.Id,
            UserId = room.UserId,
            UserName = room.User != null ? $"{room.User.FirstName} {room.User.LastName}".Trim() : null,
            UserEmail = room.User?.Email,
            GuestEmail = room.GuestEmail,
            GuestName = room.GuestName,
            AssignedToId = room.AssignedToId,
            AssignedToName = room.AssignedTo != null ? $"{room.AssignedTo.FirstName} {room.AssignedTo.LastName}".Trim() : null,
            Status = room.Status.ToString(),
            Priority = room.Priority.ToString(),
            Subject = room.Subject,
            Category = room.Category,
            RelatedOrderId = room.RelatedOrderId,
            RelatedProductId = room.RelatedProductId,
            CreatedAt = room.CreatedAt,
            LastMessageAt = room.LastMessageAt,
            MessageCount = room.MessageCount,
            SatisfactionRating = room.SatisfactionRating,
            LastMessage = lastMessage != null ? new ChatMessageDto
            {
                Id = lastMessage.Id,
                Content = lastMessage.Content,
                IsFromAdmin = lastMessage.IsFromAdmin,
                IsFromBot = lastMessage.IsFromBot,
                CreatedAt = lastMessage.CreatedAt
            } : null
        };
    }
}

public class ChatbotService : IChatbotService
{
    private readonly ApplicationDbContext _context;

    public ChatbotService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BotQueryResponse> ProcessMessageAsync(string message, Guid? chatRoomId = null)
    {
        var normalizedMessage = message.ToLowerInvariant().Trim();
        
        // Search for matching response
        var responses = await _context.ChatbotResponses
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.Priority)
            .ToListAsync();

        foreach (var response in responses)
        {
            var keywords = JsonSerializer.Deserialize<List<string>>(response.Keywords) ?? new List<string>();
            
            if (keywords.Any(k => normalizedMessage.Contains(k.ToLowerInvariant())))
            {
                // Update hit count
                response.HitCount++;
                await _context.SaveChangesAsync();

                var quickReplies = !string.IsNullOrEmpty(response.QuickReplies)
                    ? JsonSerializer.Deserialize<List<string>>(response.QuickReplies)
                    : null;

                return new BotQueryResponse
                {
                    Found = true,
                    Answer = response.Answer,
                    QuickReplies = quickReplies,
                    ActionType = response.ActionType,
                    ActionData = response.ActionData,
                    ShouldEscalate = response.ActionType == "contact_human"
                };
            }
        }

        // No match found - escalate to human
        return new BotQueryResponse
        {
            Found = false,
            Answer = "Sorunuzu tam olarak anlayamadım. Sizi bir müşteri temsilcisine yönlendiriyorum.",
            QuickReplies = ChatSettings.DefaultQuickReplies.ToList(),
            ShouldEscalate = true
        };
    }

    public async Task<ChatbotResponseDto> CreateResponseAsync(CreateChatbotResponseRequest request)
    {
        var response = new ChatbotResponse
        {
            Question = request.Question,
            Keywords = JsonSerializer.Serialize(request.Keywords),
            Answer = request.Answer,
            Category = request.Category,
            QuickReplies = request.QuickReplies != null ? JsonSerializer.Serialize(request.QuickReplies) : null,
            ActionType = request.ActionType,
            ActionData = request.ActionData,
            Priority = request.Priority
        };

        _context.ChatbotResponses.Add(response);
        await _context.SaveChangesAsync();

        return await GetResponseAsync(response.Id) ?? throw new Exception("Creation failed");
    }

    public async Task<ChatbotResponseDto?> GetResponseAsync(Guid id)
    {
        var response = await _context.ChatbotResponses.FindAsync(id);
        if (response == null) return null;

        return MapToDto(response);
    }

    public async Task<List<ChatbotResponseDto>> GetAllResponsesAsync(string? category = null)
    {
        var query = _context.ChatbotResponses.AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(r => r.Category == category);
        }

        var responses = await query.OrderByDescending(r => r.Priority).ToListAsync();
        return responses.Select(MapToDto).ToList();
    }

    public async Task<ChatbotResponseDto> UpdateResponseAsync(Guid id, CreateChatbotResponseRequest request)
    {
        var response = await _context.ChatbotResponses.FindAsync(id);
        if (response == null) throw new KeyNotFoundException("Response not found");

        response.Question = request.Question;
        response.Keywords = JsonSerializer.Serialize(request.Keywords);
        response.Answer = request.Answer;
        response.Category = request.Category;
        response.QuickReplies = request.QuickReplies != null ? JsonSerializer.Serialize(request.QuickReplies) : null;
        response.ActionType = request.ActionType;
        response.ActionData = request.ActionData;
        response.Priority = request.Priority;
        response.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(response);
    }

    public async Task<bool> DeleteResponseAsync(Guid id)
    {
        var response = await _context.ChatbotResponses.FindAsync(id);
        if (response == null) return false;

        _context.ChatbotResponses.Remove(response);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<string>> GetQuickRepliesAsync()
    {
        return ChatSettings.DefaultQuickReplies.ToList();
    }

    public async Task<List<string>> GetCategoryQuickRepliesAsync(string category)
    {
        var response = await _context.ChatbotResponses
            .Where(r => r.Category == category && !string.IsNullOrEmpty(r.QuickReplies))
            .FirstOrDefaultAsync();

        if (response?.QuickReplies != null)
        {
            return JsonSerializer.Deserialize<List<string>>(response.QuickReplies) ?? new List<string>();
        }

        return ChatSettings.DefaultQuickReplies.ToList();
    }

    private ChatbotResponseDto MapToDto(ChatbotResponse response)
    {
        return new ChatbotResponseDto
        {
            Id = response.Id,
            Question = response.Question,
            Keywords = JsonSerializer.Deserialize<List<string>>(response.Keywords) ?? new List<string>(),
            Answer = response.Answer,
            Category = response.Category,
            QuickReplies = !string.IsNullOrEmpty(response.QuickReplies) 
                ? JsonSerializer.Deserialize<List<string>>(response.QuickReplies) 
                : null,
            ActionType = response.ActionType,
            Priority = response.Priority,
            IsActive = response.IsActive,
            HitCount = response.HitCount
        };
    }
}

public class ChatAgentService : IChatAgentService
{
    private readonly ApplicationDbContext _context;

    public ChatAgentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatAgentDto> GetOrCreateAgentAsync(string userId)
    {
        var agent = await _context.ChatAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (agent == null)
        {
            agent = new ChatAgent
            {
                UserId = userId,
                IsAvailable = true,
                IsOnline = true,
                LastActiveAt = DateTime.UtcNow
            };
            _context.ChatAgents.Add(agent);
            await _context.SaveChangesAsync();
            
            agent = await _context.ChatAgents
                .Include(a => a.User)
                .FirstAsync(a => a.UserId == userId);
        }

        return MapToDto(agent);
    }

    public async Task<ChatAgentDto?> GetAgentAsync(Guid agentId)
    {
        var agent = await _context.ChatAgents
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == agentId);

        return agent != null ? MapToDto(agent) : null;
    }

    public async Task<List<ChatAgentDto>> GetAllAgentsAsync(bool? onlineOnly = null)
    {
        var query = _context.ChatAgents.Include(a => a.User).AsQueryable();

        if (onlineOnly == true)
        {
            query = query.Where(a => a.IsOnline);
        }

        var agents = await query.ToListAsync();
        return agents.Select(MapToDto).ToList();
    }

    public async Task<ChatAgentDto> UpdateAgentStatusAsync(string userId, UpdateAgentStatusRequest request)
    {
        var agent = await _context.ChatAgents.FirstOrDefaultAsync(a => a.UserId == userId);
        if (agent == null) throw new KeyNotFoundException("Agent not found");

        if (request.IsAvailable.HasValue)
        {
            agent.IsAvailable = request.IsAvailable.Value;
        }

        if (request.IsOnline.HasValue)
        {
            agent.IsOnline = request.IsOnline.Value;
            agent.LastActiveAt = DateTime.UtcNow;
        }

        if (request.MaxConcurrentChats.HasValue)
        {
            agent.MaxConcurrentChats = request.MaxConcurrentChats.Value;
        }

        if (request.Specializations != null)
        {
            agent.Specializations = JsonSerializer.Serialize(request.Specializations);
        }

        await _context.SaveChangesAsync();

        agent = await _context.ChatAgents.Include(a => a.User).FirstAsync(a => a.UserId == userId);
        return MapToDto(agent);
    }

    public async Task<ChatAgentDto?> GetAvailableAgentAsync(string? category = null)
    {
        var query = _context.ChatAgents
            .Include(a => a.User)
            .Where(a => a.IsOnline && a.IsAvailable && a.ActiveChats < a.MaxConcurrentChats);

        if (!string.IsNullOrEmpty(category))
        {
            // Prefer agents with matching specialization
            var specializedAgent = await query
                .Where(a => a.Specializations != null && a.Specializations.Contains(category))
                .OrderBy(a => a.ActiveChats)
                .FirstOrDefaultAsync();

            if (specializedAgent != null)
            {
                return MapToDto(specializedAgent);
            }
        }

        // Fallback to any available agent
        var agent = await query.OrderBy(a => a.ActiveChats).FirstOrDefaultAsync();
        return agent != null ? MapToDto(agent) : null;
    }

    public async Task<bool> UpdateAgentStatsAsync(Guid agentId, double responseTime, double? rating = null)
    {
        var agent = await _context.ChatAgents.FindAsync(agentId);
        if (agent == null) return false;

        // Update average response time
        var totalChats = agent.TotalChatsHandled > 0 ? agent.TotalChatsHandled : 1;
        agent.AverageResponseTime = ((agent.AverageResponseTime * (totalChats - 1)) + responseTime) / totalChats;

        if (rating.HasValue)
        {
            agent.AverageRating = ((agent.AverageRating * (totalChats - 1)) + rating.Value) / totalChats;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ChatStatsDto> GetChatStatsAsync()
    {
        var today = DateTime.UtcNow.Date;

        var stats = new ChatStatsDto
        {
            TotalChats = await _context.ChatRooms.CountAsync(),
            ActiveChats = await _context.ChatRooms.CountAsync(r => r.Status == ChatRoomStatus.Active),
            WaitingChats = await _context.ChatRooms.CountAsync(r => r.Status == ChatRoomStatus.Waiting),
            ResolvedToday = await _context.ChatRooms.CountAsync(r => r.Status == ChatRoomStatus.Resolved && r.ClosedAt >= today),
            OnlineAgents = await GetAllAgentsAsync(onlineOnly: true)
        };

        // Calculate averages
        var resolvedChats = await _context.ChatRooms
            .Where(r => r.SatisfactionRating.HasValue)
            .ToListAsync();

        if (resolvedChats.Any())
        {
            stats.AverageSatisfaction = resolvedChats.Average(r => r.SatisfactionRating ?? 0);
        }

        // Chats by category
        stats.ChatsByCategory = await _context.ChatRooms
            .Where(r => r.Category != null)
            .GroupBy(r => r.Category!)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count);

        // Chats by status
        stats.ChatsByStatus = await _context.ChatRooms
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        return stats;
    }

    private ChatAgentDto MapToDto(ChatAgent agent)
    {
        return new ChatAgentDto
        {
            Id = agent.Id,
            UserId = agent.UserId,
            UserName = agent.User != null ? $"{agent.User.FirstName} {agent.User.LastName}".Trim() : "",
            UserEmail = agent.User?.Email,
            IsAvailable = agent.IsAvailable,
            IsOnline = agent.IsOnline,
            ActiveChats = agent.ActiveChats,
            MaxConcurrentChats = agent.MaxConcurrentChats,
            TotalChatsHandled = agent.TotalChatsHandled,
            AverageResponseTime = agent.AverageResponseTime,
            AverageRating = agent.AverageRating,
            Specializations = !string.IsNullOrEmpty(agent.Specializations)
                ? JsonSerializer.Deserialize<List<string>>(agent.Specializations)
                : null,
            LastActiveAt = agent.LastActiveAt
        };
    }
}
