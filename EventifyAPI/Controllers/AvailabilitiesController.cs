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
    public class AvailabilitiesController : ControllerBase
    {
        private readonly EventifyDbContext _context;
        public AvailabilitiesController(EventifyDbContext context) => _context = context;

        // Provider creates availability
        [HttpPost]
        [Authorize(Roles = "EventServiceProvider")]
        public async Task<IActionResult> CreateAvailability([FromBody] CreateAvailabilityDto dto)
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            // ensure provider exists for this user
            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null) return BadRequest("Provider record not found for current user.");

            var availability = new Availability
            {
                AvailableDate = dto.AvailableDate,
                IsBooked = false,
                EventServiceProviderId = dto.EventServiceProviderId == 0 ? provider.EventServiceProviderId : dto.EventServiceProviderId
            };

            // Simple ownership check: if dto provided providerId ensure it matches logged-in provider
            if (availability.EventServiceProviderId != provider.EventServiceProviderId)
                return Forbid();

            _context.Availabilities.Add(availability);
            await _context.SaveChangesAsync();

            var resp = new AvailabilityDto
            {
                AvailabilityId = availability.AvailabilityId,
                AvailableDate = availability.AvailableDate,
                IsBooked = availability.IsBooked,
                EventServiceProviderId = availability.EventServiceProviderId
            };

            return CreatedAtAction(nameof(GetAvailability), new { id = resp.AvailabilityId }, resp);
        }

        // Get single availability (public)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAvailability(int id)
        {
            var a = await _context.Availabilities.FindAsync(id);
            if (a == null) return NotFound();
            var resp = new AvailabilityDto
            {
                AvailabilityId = a.AvailabilityId,
                AvailableDate = a.AvailableDate,
                IsBooked = a.IsBooked,
                EventServiceProviderId = a.EventServiceProviderId
            };
            return Ok(resp);
        }

        // Provider lists own availabilities
        [HttpGet("me")]
        [Authorize(Roles = "EventServiceProvider")]
        public async Task<IActionResult> GetMyAvailabilities()
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null) return BadRequest("Provider record not found for current user.");

            var list = await _context.Availabilities
                .Where(a => a.EventServiceProviderId == provider.EventServiceProviderId)
                .Select(a => new AvailabilityDto
                {
                    AvailabilityId = a.AvailabilityId,
                    AvailableDate = a.AvailableDate,
                    IsBooked = a.IsBooked,
                    EventServiceProviderId = a.EventServiceProviderId
                }).ToListAsync();

            return Ok(list);
        }

        // Public: get unbooked availabilities for a provider
        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetProviderAvailabilities(int providerId)
        {
            var list = await _context.Availabilities
                .Where(a => a.EventServiceProviderId == providerId && !a.IsBooked)
                .Select(a => new AvailabilityDto
                {
                    AvailabilityId = a.AvailabilityId,
                    AvailableDate = a.AvailableDate,
                    IsBooked = a.IsBooked,
                    EventServiceProviderId = a.EventServiceProviderId
                }).ToListAsync();

            return Ok(list);
        }

        // Provider deletes an availability (only if not booked)
        [HttpDelete("{id}")]
        [Authorize(Roles = "EventServiceProvider")]
        public async Task<IActionResult> DeleteAvailability(int id)
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null) return BadRequest("Provider record not found for current user.");

            var avail = await _context.Availabilities.FirstOrDefaultAsync(a => a.AvailabilityId == id && a.EventServiceProviderId == provider.EventServiceProviderId);
            if (avail == null) return NotFound();
            if (avail.IsBooked) return BadRequest("Cannot delete a booked availability.");

            _context.Availabilities.Remove(avail);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Availability removed." });
        }

        // Optional: mark an availability as booked (used by booking logic)
        [HttpPut("{id}/mark-booked")]
        [Authorize]
        public async Task<IActionResult> MarkAsBooked(int id)
        {
            var avail = await _context.Availabilities.FindAsync(id);
            if (avail == null) return NotFound();
            if (avail.IsBooked) return BadRequest("Already booked.");

            avail.IsBooked = true;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Availability marked as booked." });
        }
    }
}
