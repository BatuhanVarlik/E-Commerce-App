using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

[Route("api/admin/reviews")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public AdminReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingReviews()
    {
        var result = await _reviewService.GetPendingReviewsAsync();
        return Ok(new { reviews = result, totalCount = result.Count });
    }

    [HttpGet]
    public async Task<IActionResult> GetAllReviews([FromQuery] bool? isApproved = null)
    {
        var allReviews = await _reviewService.GetAllReviewsAsync();
        
        // Frontend'ten gelen filtreye göre filtrele
        if (isApproved.HasValue)
        {
            allReviews = allReviews.Where(r => r.IsApproved == isApproved.Value).ToList();
        }
        
        return Ok(new { reviews = allReviews, totalCount = allReviews.Count });
    }

    [HttpPost("{reviewId}/approve")]
    public async Task<IActionResult> ApproveReview(string reviewId)
    {
        try
        {
            await _reviewService.ApproveReviewAsync(reviewId);
            return Ok(new { message = "Yorum onaylandı." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{reviewId}/reject")]
    public async Task<IActionResult> RejectReview(string reviewId)
    {
        try
        {
            await _reviewService.RejectReviewAsync(reviewId);
            return Ok(new { message = "Yorum reddedildi ve silindi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("approve-empty-reviews")]
    public async Task<IActionResult> ApproveEmptyReviews()
    {
        try
        {
            var allReviews = await _reviewService.GetAllReviewsAsync();
            var emptyReviews = allReviews.Where(r => !r.IsApproved && string.IsNullOrEmpty(r.Comment?.Trim())).ToList();
            
            foreach (var review in emptyReviews)
            {
                await _reviewService.ApproveReviewAsync(review.Id);
            }
            
            return Ok(new { message = $"{emptyReviews.Count} boş yorum otomatik onaylandı.", count = emptyReviews.Count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
