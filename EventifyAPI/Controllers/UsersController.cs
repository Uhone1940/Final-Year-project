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
    [Authorize(Roles = "Admin")]
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
                .Include(u => u.EventServiceProvider) // include provider info if it exists
                .ThenInclude(p => p.ServiceCategory) // include category name for provider
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
                _ => query.OrderBy(u => u.UserId) // default sort
            };

            var users = await query.ToListAsync();

            var response = users.Select(u => new AdminUserResponseDto
            {
                UserId = u.UserId,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.Name,
                IsSuspended = u.IsSuspended,
                BusinessName = u.EventServiceProvider?.BusinessName,
                CategoryName = u.EventServiceProvider?.ServiceCategory?.Name,
                Location = u.EventServiceProvider?.Location,
                PhoneNumber = u.EventServiceProvider?.PhoneNumber
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
                return NotFound("User not found.");

            var response = new AdminUserResponseDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                IsSuspended = user.IsSuspended,
                BusinessName = user.EventServiceProvider?.BusinessName,
                CategoryName = user.EventServiceProvider?.ServiceCategory?.Name,
                Location = user.EventServiceProvider?.Location,
                PhoneNumber = user.EventServiceProvider?.PhoneNumber
            };

            return Ok(response);
        }

        // ------------------ SUSPEND / UNSUSPEND USER ------------------
        [HttpPut("{id}/suspend")]
        public async Task<IActionResult> SuspendUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.EventServiceProvider)
                .ThenInclude(p => p.ServiceCategory)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null) return NotFound("User not found.");

            user.IsSuspended = !user.IsSuspended;
            await _context.SaveChangesAsync();

            var response = new AdminUserResponseDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                IsSuspended = user.IsSuspended,
                BusinessName = user.EventServiceProvider?.BusinessName,
                CategoryName = user.EventServiceProvider?.ServiceCategory?.Name,
                Location = user.EventServiceProvider?.Location,
                PhoneNumber = user.EventServiceProvider?.PhoneNumber
            };

            var status = user.IsSuspended ? "suspended" : "active";
            return Ok(new { Message = $"User account is now {status}.", User = response });
        }

        // ------------------ DELETE USER ------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.EventServiceProvider)
                .ThenInclude(p => p.ServiceCategory)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null) return NotFound("User not found.");

            var response = new AdminUserResponseDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                IsSuspended = user.IsSuspended,
                BusinessName = user.EventServiceProvider?.BusinessName,
                CategoryName = user.EventServiceProvider?.ServiceCategory?.Name,
                Location = user.EventServiceProvider?.Location,
                PhoneNumber = user.EventServiceProvider?.PhoneNumber
            };

            // Remove provider record if user is a provider
            if (user.Role.Name == "EventServiceProvider" && user.EventServiceProvider != null)
            {
                _context.EventServiceProviders.Remove(user.EventServiceProvider);
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "User deleted successfully.", User = response });
        }

    }
}
