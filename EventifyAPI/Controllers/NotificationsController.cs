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

        // Admin creates notification for multiple users (BULK)
        [HttpPost("bulk")]
        [Authorize(Roles = "Admin,SystemAdmin")]
        public async Task<IActionResult> CreateBulkNotification([FromBody] CreateBulkNotificationDto dto)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Title is required." });
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Message is required." });
            if (string.IsNullOrWhiteSpace(dto.RecipientType))
                return BadRequest(new { message = "RecipientType is required." });

            // Get target users based on recipient type
            IQueryable<User> query = _context.Users.Include(u => u.Role);
            switch (dto.RecipientType.ToLower())
            {
                case "all":
                    // All users except admins
                    query = query.Where(u => u.Role.Name != "Admin" && u.Role.Name != "SystemAdmin");
                    break;
                case "providers":
                    query = query.Where(u => u.Role.Name == "EventServiceProvider");
                    break;
                case "customers":
                    query = query.Where(u => u.Role.Name == "Customer");
                    break;
                default:
                    return BadRequest(new { message = "Invalid recipient type. Use 'all', 'providers', or 'customers'." });
            }

            var targetUsers = await query.Select(u => u.UserId).ToListAsync();
            if (!targetUsers.Any())
                return BadRequest(new { message = "No users found for the selected recipient type." });

            // CREATE ONE TIMESTAMP FOR ALL NOTIFICATIONS IN THIS BATCH
            var sentAt = DateTime.UtcNow;

            // Create notifications for all target users with the SAME timestamp
            var notifications = targetUsers.Select(userId => new Notification
            {
                UserId = userId,
                Title = dto.Title,
                Message = dto.Message,
                SentAt = sentAt,  // Use the same timestamp for all
                IsRead = false
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Notifications sent successfully.",
                recipientCount = notifications.Count,
                recipientType = dto.RecipientType
            });
        }

        // Admin creates notification for a single user
        [HttpPost]
        [Authorize(Roles = "Admin,SystemAdmin")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Title is required." });

            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Message is required." });

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return BadRequest(new { message = "User not found." });

            var note = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(note);
            await _context.SaveChangesAsync();

            var resp = new NotificationDto
            {
                NotificationId = note.NotificationId,
                Title = note.Title,
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
            if (note == null) return NotFound(new { message = "Notification not found." });

            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = int.TryParse(uid, out var userId);
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);

            if (user?.Role?.Name != "Admin" && user?.Role?.Name != "SystemAdmin" && note.UserId != userId)
                return Forbid();

            var resp = new NotificationDto
            {
                NotificationId = note.NotificationId,
                Title = note.Title,
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
                    Title = n.Title,
                    Message = n.Message,
                    SentAt = n.SentAt,
                    IsRead = n.IsRead,
                    UserId = n.UserId
                }).ToListAsync();

            return Ok(list);
        }
        // Admin creates notification for multiple users (BULK)
        [HttpGet("sent")]
        [Authorize(Roles = "Admin,SystemAdmin")]
        public async Task<IActionResult> GetSentNotifications()
        {
            try
            {
                // Get counts for each user type
                var customerCount = await _context.Users
                    .Include(u => u.Role)
                    .CountAsync(u => u.Role.Name == "Customer");

                var providerCount = await _context.Users
                    .Include(u => u.Role)
                    .CountAsync(u => u.Role.Name == "EventServiceProvider");

                var allCount = await _context.Users
                    .Include(u => u.Role)
                    .CountAsync(u => u.Role.Name != "Admin" && u.Role.Name != "SystemAdmin");

                // GROUP BY TITLE ONLY
                var sentNotifications = await _context.Notifications
                    .GroupBy(n => n.Title)
                    .Select(g => new
                    {
                        Id = g.Min(n => n.NotificationId),
                        Title = g.Key,
                        Message = g.First().Message,  // Get message from first notification
                        RecipientCount = g.Count(),   // Total count across all sends
                        SentAt = g.Max(n => n.SentAt) // Most recent send time
                    })
                    .OrderByDescending(n => n.SentAt)
                    .ToListAsync();

                // Determine recipient type based on count
                var result = sentNotifications.Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Message,
                    n.RecipientCount,
                    RecipientType = Math.Abs(n.RecipientCount - allCount) <= 2 ? "all" :
                                  Math.Abs(n.RecipientCount - providerCount) <= 2 ? "providers" :
                                  Math.Abs(n.RecipientCount - customerCount) <= 2 ? "customers" : "custom",
                    n.SentAt
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching sent notifications.", error = ex.Message });
            }
        }

        // Mark as read
        [HttpPut("{id}/mark-read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var note = await _context.Notifications.FindAsync(id);
            if (note == null) return NotFound(new { message = "Notification not found." });

            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();
            if (note.UserId != userId) return Forbid();

            note.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Notification marked as read." });
        }

        // Delete notification (owner or admin)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var note = await _context.Notifications.FindAsync(id);
            if (note == null) return NotFound(new { message = "Notification not found." });

            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = int.TryParse(uid, out var userId);
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return Unauthorized();
            if (user.Role?.Name != "Admin" && user.Role?.Name != "SystemAdmin" && note.UserId != userId)
                return Forbid();

            _context.Notifications.Remove(note);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Notification deleted." });
        }

        // An endpoint to delete a notification broadcast
        [HttpDelete("broadcast/{id}")]
        [Authorize(Roles = "Admin,SystemAdmin")]
        public async Task<IActionResult> DeleteNotificationBroadcast(int id)
        {
            try
            {
                // Find the notification to get its title
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                    return NotFound(new { message = "Notification not found." });

                // Delete ALL notifications with the same title
                var notificationsToDelete = await _context.Notifications
                    .Where(n => n.Title == notification.Title)
                    .ToListAsync();

                _context.Notifications.RemoveRange(notificationsToDelete);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Notification deleted successfully.", count = notificationsToDelete.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting notification." });
            }
        }
    }
}