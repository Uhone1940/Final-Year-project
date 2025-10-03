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
        public NotificationsController(EventifyDbContext context) => _context = context;

        // Admin creates notification for a user
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return BadRequest("User not found.");

            var note = new Notification
            {
                UserId = dto.UserId,
                Message = dto.Message,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(note);
            await _context.SaveChangesAsync();

            var resp = new NotificationDto
            {
                NotificationId = note.NotificationId,
                Message = note.Message,
                SentAt = note.SentAt,
                IsRead = note.IsRead,
                UserId = note.UserId
            };

            return CreatedAtAction(nameof(GetNotification), new { id = resp.NotificationId }, resp);
        }

        // Get a single notification (owner or admin)
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetNotification(int id)
        {
            var note = await _context.Notifications.FindAsync(id);
            if (note == null) return NotFound();

            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = int.TryParse(uid, out var userId);
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);

            if (user?.Role?.Name != "Admin" && note.UserId != userId) return Forbid();

            var resp = new NotificationDto
            {
                NotificationId = note.NotificationId,
                Message = note.Message,
                SentAt = note.SentAt,
                IsRead = note.IsRead,
                UserId = note.UserId
            };

            return Ok(resp);
        }

        // Get notifications for logged-in user
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyNotifications()
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var list = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.SentAt)
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    Message = n.Message,
                    SentAt = n.SentAt,
                    IsRead = n.IsRead,
                    UserId = n.UserId
                }).ToListAsync();

            return Ok(list);
        }

        // Mark as read
        [HttpPut("{id}/mark-read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var note = await _context.Notifications.FindAsync(id);
            if (note == null) return NotFound();

            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();
            if (note.UserId != userId) return Forbid();

            note.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Notification marked as read." });
        }

        // Delete notification (owner or admin)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var note = await _context.Notifications.FindAsync(id);
            if (note == null) return NotFound();

            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = int.TryParse(uid, out var userId);
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return Unauthorized();
            if (user.Role?.Name != "Admin" && note.UserId != userId) return Forbid();

            _context.Notifications.Remove(note);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Notification deleted." });
        }
    }
}
