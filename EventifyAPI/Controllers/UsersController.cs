using EventifyAPI.Data;
using EventifyAPI.DTOs;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,SystemAdmin")] // Allow both Admin roles
    public class UsersController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public UsersController(EventifyDbContext context)
        {
            _context = context;
        }

        // ------------------ GET ALL USERS WITH FILTERS & SORTING ------------------
        [HttpGet]
        public async Task<IActionResult> GetAllUsers(
            [FromQuery] string? role = null,
            [FromQuery] bool? isSuspended = null,
            [FromQuery] string? sortBy = null) // "name", "email", "role"
        {
            var query = _context.Users
                .Include(u => u.Role)
                .Include(u => u.EventServiceProvider)
                .ThenInclude(p => p.ServiceCategory)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role))
                query = query.Where(u => u.Role.Name.ToLower() == role.ToLower());

            if (isSuspended.HasValue)
                query = query.Where(u => u.IsSuspended == isSuspended.Value);

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "name" => query.OrderBy(u => u.FullName),
                "email" => query.OrderBy(u => u.Email),
                "role" => query.OrderBy(u => u.Role.Name),
                _ => query.OrderByDescending(u => u.UserId) // Most recent first
            };

            var users = await query.ToListAsync();

            var response = users.Select(u => new
            {
                id = u.UserId,
                fullName = u.FullName,
                email = u.Email,
                role = u.Role.Name,
                isSuspended = u.IsSuspended,
                createdAt = u.CreatedAt, // Add this if you have it in your User model
                businessName = u.EventServiceProvider?.BusinessName,
                categoryName = u.EventServiceProvider?.ServiceCategory?.Name,
                location = u.EventServiceProvider?.Location,
                phoneNumber = u.EventServiceProvider?.PhoneNumber
            }).ToList();

            return Ok(response);
        }

        // ------------------ GET SINGLE USER ------------------
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.EventServiceProvider)
                .ThenInclude(p => p.ServiceCategory)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
                return NotFound(new { message = "User not found." });

            var response = new
            {
                id = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role.Name,
                isSuspended = user.IsSuspended,
                createdAt = user.CreatedAt,
                businessName = user.EventServiceProvider?.BusinessName,
                categoryName = user.EventServiceProvider?.ServiceCategory?.Name,
                location = user.EventServiceProvider?.Location,
                phoneNumber = user.EventServiceProvider?.PhoneNumber
            };

            return Ok(response);
        }

        // ------------------ SUSPEND USER ------------------
        [HttpPut("{id}/suspend")]
        public async Task<IActionResult> SuspendUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found." });

            if (user.IsSuspended)
                return BadRequest(new { message = "User is already suspended." });

            user.IsSuspended = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User suspended successfully." });
        }

        // ------------------ UNSUSPEND USER ------------------
        [HttpPut("{id}/unsuspend")]
        public async Task<IActionResult> UnsuspendUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found." });

            if (!user.IsSuspended)
                return BadRequest(new { message = "User is not suspended." });

            user.IsSuspended = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User unsuspended successfully." });
        }

        // ------------------ DELETE USER ------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.EventServiceProvider)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
                return NotFound(new { message = "User not found." });

            // Prevent admin from deleting themselves
            var currentUserId = int.Parse(User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ?? "0");
            if (currentUserId == id)
                return BadRequest(new { message = "You cannot delete your own account." });

            // Remove provider record if user is a provider
            if (user.Role.Name == "EventServiceProvider" && user.EventServiceProvider != null)
            {
                _context.EventServiceProviders.Remove(user.EventServiceProvider);
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully." });
        }

        // ------------------ GET STATISTICS ------------------
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => !u.IsSuspended);
            var suspendedUsers = await _context.Users.CountAsync(u => u.IsSuspended);
            var customerCount = await _context.Users.CountAsync(u => u.Role.Name == "Customer");
            var providerCount = await _context.Users.CountAsync(u => u.Role.Name == "EventServiceProvider");

            return Ok(new
            {
                totalUsers,
                activeUsers,
                suspendedUsers,
                customerCount,
                providerCount
            });
        }
    }
}