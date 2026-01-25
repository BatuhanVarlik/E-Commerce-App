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
        return Ok(result);
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
}
