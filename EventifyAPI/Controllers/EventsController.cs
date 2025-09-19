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

        // GET: api/events
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetEvents()
        {
            var events = await _context.Events
                .Include(e => e.User) // include creator
                .ToListAsync();

            var response = events.Select(e => new EventResponseDto
            {
                EventId = e.EventId,
                Title = e.Title,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location,
                CreatedBy = e.User.FullName
            });

            return Ok(response);
        }

        // GET: api/events/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EventResponseDto>> GetEvent(int id)
        {
            var e = await _context.Events
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.EventId == id);

            if (e == null) return NotFound();

            var response = new EventResponseDto
            {
                EventId = e.EventId,
                Title = e.Title,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location,
                CreatedBy = e.User.FullName
            };

            return Ok(response);
        }

        // POST: api/events
        [Authorize(Roles = "Customer")] // Only customers create events
        [HttpPost]
        public async Task<IActionResult> CreateEvent(CreateEventDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var ev = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                EventDate = dto.EventDate,
                Location = dto.Location,
                UserId = userId
            };

            _context.Events.Add(ev);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Event created successfully.", EventId = ev.EventId });
        }

        // PUT: api/events/{id}
        [Authorize(Roles = "Customer")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(int id, UpdateEventDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var ev = await _context.Events.FirstOrDefaultAsync(e => e.EventId == id && e.UserId == userId);

            if (ev == null) return NotFound("Event not found or you don’t own this event.");

            ev.Title = dto.Title ?? ev.Title;
            ev.Description = dto.Description ?? ev.Description;
            ev.EventDate = dto.EventDate ?? ev.EventDate;
            ev.Location = dto.Location ?? ev.Location;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Event updated successfully." });
        }

        // DELETE: api/events/{id}
        [Authorize(Roles = "Customer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var ev = await _context.Events.FirstOrDefaultAsync(e => e.EventId == id && e.UserId == userId);

            if (ev == null) return NotFound("Event not found or you don’t own this event.");

            _context.Events.Remove(ev);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Event deleted successfully." });
        }
    }
}
