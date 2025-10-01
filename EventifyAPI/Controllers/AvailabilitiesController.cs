// Controllers/AvailabilitiesController.cs
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

        public AvailabilitiesController(EventifyDbContext context)
        {
            _context = context;
        }

        // Provider adds availability
        [HttpPost]
        [Authorize(Roles = "EventServiceProvider")]
        public async Task<IActionResult> CreateAvailability(CreateAvailabilityDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null) return BadRequest("Provider record not found.");

            var availability = new Availability
            {
                EventServiceProviderId = provider.EventServiceProviderId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate
            };

            _context.Availabilities.Add(availability);
            await _context.SaveChangesAsync();

            var resp = new AvailabilityResponseDto
            {
                AvailabilityId = availability.AvailabilityId,
                StartDate = availability.StartDate,
                EndDate = availability.EndDate
            };

            return Ok(resp);
        }

        // Provider gets own availabilities
        [HttpGet("me")]
        [Authorize(Roles = "EventServiceProvider")]
        public async Task<IActionResult> GetMyAvailabilities()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null) return BadRequest("Provider record not found.");

            var avail = await _context.Availabilities
                .Where(a => a.EventServiceProviderId == provider.EventServiceProviderId)
                .Select(a => new AvailabilityResponseDto
                {
                    AvailabilityId = a.AvailabilityId,
                    StartDate = a.StartDate,
                    EndDate = a.EndDate
                })
                .ToListAsync();

            return Ok(avail);
        }

        // Provider deletes an availability
        [HttpDelete("{id}")]
        [Authorize(Roles = "EventServiceProvider")]
        public async Task<IActionResult> DeleteAvailability(int id)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null) return BadRequest("Provider record not found.");

            var availability = await _context.Availabilities.FirstOrDefaultAsync(a => a.AvailabilityId == id && a.EventServiceProviderId == provider.EventServiceProviderId);
            if (availability == null) return NotFound();

            _context.Availabilities.Remove(availability);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Availability removed." });
        }
    }
}
