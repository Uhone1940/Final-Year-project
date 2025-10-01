using EventifyAPI.Data;
using EventifyAPI.DTOs;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public ReviewsController(EventifyDbContext context)
        {
            _context = context;
        }

        // Create a review (customer)
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateReview(CreateReviewDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            // Basic validation: provider exists
            var provider = await _context.EventServiceProviders.FindAsync(dto.EventServiceProviderId);
            if (provider == null) return BadRequest("Provider not found.");

            if (dto.Rating < 1 || dto.Rating > 5) return BadRequest("Rating must be between 1 and 5.");

            var review = new Review
            {
                EventServiceProviderId = dto.EventServiceProviderId,
                UserId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            var resp = new ReviewResponseDto
            {
                ReviewId = review.ReviewId,
                ProviderId = review.EventServiceProviderId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt,
                UserId = review.UserId,
                UserFullName = (await _context.Users.FindAsync(review.UserId))?.FullName ?? string.Empty
            };

            return Ok(resp);
        }

        // Get reviews for provider
        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetReviewsForProvider(int providerId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.EventServiceProviderId == providerId)
                .Select(r => new ReviewResponseDto
                {
                    ReviewId = r.ReviewId,
                    ProviderId = r.EventServiceProviderId,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UserId = r.UserId,
                    UserFullName = r.User.FullName
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // Delete review (Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound("Review not found.");

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Review deleted." });
        }
    }
}
