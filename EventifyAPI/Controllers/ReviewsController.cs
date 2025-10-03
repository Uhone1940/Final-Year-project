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
        public ReviewsController(EventifyDbContext context) => _context = context;

        // Customer creates a review for a provider
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var provider = await _context.EventServiceProviders.FindAsync(dto.EventServiceProviderId);
            if (provider == null) return BadRequest("Provider not found.");

            if (dto.Rating < 1 || dto.Rating > 5) return BadRequest("Rating must be between 1 and 5.");

            var review = new Review
            {
                UserId = userId,
                EventServiceProviderId = dto.EventServiceProviderId,
                Rating = dto.Rating,
                Comment = dto.Comment
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            var resp = new ReviewDto
            {
                ReviewId = review.ReviewId,
                Rating = review.Rating,
                Comment = review.Comment,
                UserId = review.UserId,
                EventServiceProviderId = review.EventServiceProviderId
            };

            return CreatedAtAction(nameof(GetReview), new { id = resp.ReviewId }, resp);
        }

        // Get single review
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReview(int id)
        {
            var r = await _context.Reviews.Include(rv => rv.User).FirstOrDefaultAsync(rv => rv.ReviewId == id);
            if (r == null) return NotFound();

            var resp = new ReviewDto
            {
                ReviewId = r.ReviewId,
                Rating = r.Rating,
                Comment = r.Comment,
                UserId = r.UserId,
                EventServiceProviderId = r.EventServiceProviderId
            };

            return Ok(resp);
        }

        // Get reviews for provider
        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetProviderReviews(int providerId)
        {
            var list = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.EventServiceProviderId == providerId)
                .Select(r => new ReviewDto
                {
                    ReviewId = r.ReviewId,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    UserId = r.UserId,
                    EventServiceProviderId = r.EventServiceProviderId
                }).ToListAsync();

            return Ok(list);
        }

        // Admin deletes a review
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var r = await _context.Reviews.FindAsync(id);
            if (r == null) return NotFound();

            _context.Reviews.Remove(r);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Review deleted." });
        }
    }
}
