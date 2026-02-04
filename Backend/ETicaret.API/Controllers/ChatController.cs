using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ETicaret.Application.DTOs.Chat;
using ETicaret.Application.Interfaces;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IChatbotService _chatbotService;
    private readonly IChatAgentService _agentService;

    public ChatController(
        IChatService chatService,
        IChatbotService chatbotService,
        IChatAgentService agentService)
    {
        _chatService = chatService;
        _chatbotService = chatbotService;
        _agentService = agentService;
    }

    private string? GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    // ========== Chat Rooms ==========

    /// <summary>
    /// Yeni chat odası oluştur (kullanıcı veya misafir)
    /// </summary>
    [HttpPost("rooms")]
    public async Task<ActionResult<ChatRoomDto>> CreateChatRoom([FromBody] CreateChatRoomRequest request)
    {
        try
        {
            var userId = GetUserId();
            var room = await _chatService.CreateChatRoomAsync(userId, request);
            return Ok(room);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Chat odası bilgisi
    /// </summary>
    [HttpGet("rooms/{roomId}")]
    public async Task<ActionResult<ChatRoomDto>> GetChatRoom(Guid roomId)
    {
        var room = await _chatService.GetChatRoomAsync(roomId);
        if (room == null) return NotFound();
        return Ok(room);
    }

    /// <summary>
    /// Kullanıcının chat odaları
    /// </summary>
    [Authorize]
    [HttpGet("rooms/my")]
    public async Task<ActionResult<List<ChatRoomDto>>> GetMyChats()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        
        var rooms = await _chatService.GetUserChatsAsync(userId);
        return Ok(rooms);
    }

    /// <summary>
    /// Tüm chat odaları (Admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("rooms")]
    public async Task<ActionResult<List<ChatRoomDto>>> GetAllChats(
        [FromQuery] string? status = null,
        [FromQuery] string? category = null)
    {
        var rooms = await _chatService.GetAllChatsAsync(status, category);
        return Ok(rooms);
    }

    /// <summary>
    /// Agent'ın aktif chatları
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("rooms/agent/{agentId}")]
    public async Task<ActionResult<List<ChatRoomDto>>> GetAgentChats(string agentId)
    {
        var rooms = await _chatService.GetAgentChatsAsync(agentId);
        return Ok(rooms);
    }

    /// <summary>
    /// Chat odası güncelle
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("rooms/{roomId}")]
    public async Task<ActionResult<ChatRoomDto>> UpdateChatRoom(Guid roomId, [FromBody] UpdateChatRoomRequest request)
    {
        try
        {
            var room = await _chatService.UpdateChatRoomAsync(roomId, request);
            return Ok(room);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Agent ata
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("rooms/{roomId}/assign/{agentId}")]
    public async Task<IActionResult> AssignAgent(Guid roomId, string agentId)
    {
        var result = await _chatService.AssignAgentAsync(roomId, agentId);
        return result ? Ok() : NotFound();
    }

    /// <summary>
    /// Chat'i kapat
    /// </summary>
    [HttpPost("rooms/{roomId}/close")]
    public async Task<IActionResult> CloseChat(Guid roomId, [FromBody] string? closingNote = null)
    {
        var result = await _chatService.CloseChatAsync(roomId, closingNote);
        return result ? Ok() : NotFound();
    }

    /// <summary>
    /// Chat'i puanla
    /// </summary>
    [HttpPost("rooms/{roomId}/rate")]
    public async Task<IActionResult> RateChat(Guid roomId, [FromBody] int rating)
    {
        var result = await _chatService.RateChatAsync(roomId, rating);
        return result ? Ok() : BadRequest();
    }

    // ========== Messages ==========

    /// <summary>
    /// Mesaj gönder
    /// </summary>
    [HttpPost("messages")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var userId = GetUserId();
            var isAdmin = User.IsInRole("Admin");
            var message = await _chatService.SendMessageAsync(userId, request, isAdmin);
            return Ok(message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Mesajları getir
    /// </summary>
    [HttpGet("rooms/{roomId}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(
        Guid roomId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var messages = await _chatService.GetMessagesAsync(roomId, page, pageSize);
        return Ok(messages);
    }

    /// <summary>
    /// Mesajları okundu işaretle
    /// </summary>
    [HttpPost("rooms/{roomId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid roomId)
    {
        var userId = GetUserId();
        await _chatService.MarkAsReadAsync(roomId, userId);
        return Ok();
    }

    /// <summary>
    /// Okunmamış mesaj sayısı
    /// </summary>
    [HttpGet("rooms/{roomId}/unread")]
    public async Task<ActionResult<int>> GetUnreadCount(Guid roomId)
    {
        var userId = GetUserId();
        var count = await _chatService.GetUnreadCountAsync(roomId, userId);
        return Ok(count);
    }

    // ========== Chatbot ==========

    /// <summary>
    /// Bot'a soru sor
    /// </summary>
    [HttpPost("bot/query")]
    public async Task<ActionResult<BotQueryResponse>> QueryBot([FromBody] BotQueryRequest request)
    {
        var response = await _chatbotService.ProcessMessageAsync(request.Message, request.ChatRoomId);
        return Ok(response);
    }

    /// <summary>
    /// Hızlı yanıtları getir
    /// </summary>
    [HttpGet("bot/quick-replies")]
    public async Task<ActionResult<List<string>>> GetQuickReplies([FromQuery] string? category = null)
    {
        var replies = string.IsNullOrEmpty(category)
            ? await _chatbotService.GetQuickRepliesAsync()
            : await _chatbotService.GetCategoryQuickRepliesAsync(category);
        return Ok(replies);
    }

    /// <summary>
    /// Bot yanıtı oluştur (Admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("bot/responses")]
    public async Task<ActionResult<ChatbotResponseDto>> CreateBotResponse([FromBody] CreateChatbotResponseRequest request)
    {
        var response = await _chatbotService.CreateResponseAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Bot yanıtlarını listele (Admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("bot/responses")]
    public async Task<ActionResult<List<ChatbotResponseDto>>> GetBotResponses([FromQuery] string? category = null)
    {
        var responses = await _chatbotService.GetAllResponsesAsync(category);
        return Ok(responses);
    }

    /// <summary>
    /// Bot yanıtı güncelle (Admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("bot/responses/{id}")]
    public async Task<ActionResult<ChatbotResponseDto>> UpdateBotResponse(Guid id, [FromBody] CreateChatbotResponseRequest request)
    {
        try
        {
            var response = await _chatbotService.UpdateResponseAsync(id, request);
            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Bot yanıtı sil (Admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("bot/responses/{id}")]
    public async Task<IActionResult> DeleteBotResponse(Guid id)
    {
        var result = await _chatbotService.DeleteResponseAsync(id);
        return result ? Ok() : NotFound();
    }

    // ========== Agents ==========

    /// <summary>
    /// Agent durumunu getir/oluştur
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("agents/me")]
    public async Task<ActionResult<ChatAgentDto>> GetMyAgentStatus()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        
        var agent = await _agentService.GetOrCreateAgentAsync(userId);
        return Ok(agent);
    }

    /// <summary>
    /// Tüm agentları listele
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("agents")]
    public async Task<ActionResult<List<ChatAgentDto>>> GetAllAgents([FromQuery] bool? onlineOnly = null)
    {
        var agents = await _agentService.GetAllAgentsAsync(onlineOnly);
        return Ok(agents);
    }

    /// <summary>
    /// Agent durumunu güncelle
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("agents/status")]
    public async Task<ActionResult<ChatAgentDto>> UpdateAgentStatus([FromBody] UpdateAgentStatusRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        
        try
        {
            var agent = await _agentService.UpdateAgentStatusAsync(userId, request);
            return Ok(agent);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Uygun agent bul
    /// </summary>
    [HttpGet("agents/available")]
    public async Task<ActionResult<ChatAgentDto>> GetAvailableAgent([FromQuery] string? category = null)
    {
        var agent = await _agentService.GetAvailableAgentAsync(category);
        return agent != null ? Ok(agent) : NotFound(new { message = "No available agents" });
    }

    /// <summary>
    /// Chat istatistikleri (Admin)
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("stats")]
    public async Task<ActionResult<ChatStatsDto>> GetChatStats()
    {
        var stats = await _agentService.GetChatStatsAsync();
        return Ok(stats);
    }
}
