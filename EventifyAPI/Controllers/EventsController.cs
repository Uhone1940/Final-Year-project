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
    public class EventsController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public EventsController(EventifyDbContext context)
        {
            _context = context;
        }

        // ------------------ GET ALL EVENTS ------------------
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetEvents([FromQuery] int? userId = null)
        {
            var query = _context.Events
                .Include(e => e.User)
                .Include(e => e.Bookings)
                .AsQueryable();

            if (userId.HasValue)
                query = query.Where(e => e.UserId == userId.Value);

            var events = await query.ToListAsync();

            var response = events.Select(e => new EventResponseDto
            {
                EventId = e.EventId,
                Name = e.Name,
                Date = e.Date,
                Location = e.Location,
                Description = e.Description,
                UserId = e.UserId,
                UserFullName = e.User.FullName,
                BookingCount = e.Bookings.Count
            }).ToList();

            return Ok(response);
        }

        // ------------------ GET SINGLE EVENT ------------------
        [HttpGet("{id}")]
        public async Task<ActionResult<EventResponseDto>> GetEvent(int id)
        {
            var e = await _context.Events
                .Include(ev => ev.User)
                .Include(ev => ev.Bookings)
                .FirstOrDefaultAsync(ev => ev.EventId == id);

            if (e == null) return NotFound("Event not found.");

            var response = new EventResponseDto
            {
                EventId = e.EventId,
                Name = e.Name,
                Date = e.Date,
                Location = e.Location,
                Description = e.Description,
                UserId = e.UserId,
                UserFullName = e.User.FullName,
                BookingCount = e.Bookings.Count
            };

            return Ok(response);
        }

        // ------------------ CREATE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateEvent(CreateEventDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var newEvent = new Event
            {
                Name = dto.Name,
                Date = dto.Date,
                Location = dto.Location,
                Description = dto.Description ?? string.Empty,
                UserId = userId
            };

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            var response = new EventResponseDto
            {
                EventId = newEvent.EventId,
                Name = newEvent.Name,
                Date = newEvent.Date,
                Location = newEvent.Location,
                Description = newEvent.Description,
                UserId = newEvent.UserId,
                UserFullName = User.Identity.Name ?? string.Empty,
                BookingCount = 0
            };

            return Ok(response);
        }

        // ------------------ UPDATE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(int id, UpdateEventDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var e = await _context.Events.FirstOrDefaultAsync(ev => ev.EventId == id && ev.UserId == userId);
            if (e == null) return NotFound("Event not found or you are not authorized.");

            e.Name = dto.Name ?? e.Name;
            e.Date = dto.Date ?? e.Date;
            e.Location = dto.Location ?? e.Location;
            e.Description = dto.Description ?? e.Description;

            await _context.SaveChangesAsync();

            var response = new EventResponseDto
            {
                EventId = e.EventId,
                Name = e.Name,
                Date = e.Date,
                Location = e.Location,
                Description = e.Description,
                UserId = e.UserId,
                UserFullName = User.Identity.Name ?? string.Empty,
                BookingCount = e.Bookings?.Count ?? 0
            };

            return Ok(response);
        }

        // ------------------ DELETE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var e = await _context.Events.FirstOrDefaultAsync(ev => ev.EventId == id && ev.UserId == userId);
            if (e == null) return NotFound("Event not found or you are not authorized.");

            _context.Events.Remove(e);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Event deleted successfully." });
        }
    }
}
