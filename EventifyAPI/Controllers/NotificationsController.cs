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
    public class NotificationsController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public NotificationsController(EventifyDbContext context)
        {
            _context = context;
        }

        // Admin/system creates notification for a user
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNotification(NotificationDto.CreateNotification dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return BadRequest("User not found.");

            var n = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Body = dto.Body,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(n);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Notification created." });
        }

        // Get notifications for logged-in user
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var notes = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto.NotificationResponse
                {
                    NotificationId = n.NotificationId,
                    Title = n.Title,
                    Body = n.Body,
                    CreatedAt = n.CreatedAt,
                    IsRead = false
                })
                .ToListAsync();

            return Ok(notes);
        }

        // Delete a notification (owner or admin)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var note = await _context.Notifications.FindAsync(id);
            if (note == null) return NotFound();

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return Unauthorized();

            if (user.Role.Name != "Admin" && note.UserId != userId)
                return Forbid();

            _context.Notifications.Remove(note);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Notification deleted." });
        }
    }
}
