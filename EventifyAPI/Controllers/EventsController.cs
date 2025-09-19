using EventifyAPI.Data;
using EventifyAPI.DTOs;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
                .Include(e => e.User)
                .Select(e => new EventResponseDto
                {
                    EventId = e.EventId,
                    Title = e.Title,
                    Description = e.Description,
                    EventDate = e.EventDate,
                    Location = e.Location,
                    UserId = e.UserId,
                    CreatedBy = e.User.FullName
                })
                .ToListAsync();

            return Ok(events);
        }

        // GET: api/events/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EventResponseDto>> GetEvent(int id)
        {
            var e = await _context.Events
                .Include(ev => ev.User)
                .FirstOrDefaultAsync(ev => ev.EventId == id);

            if (e == null) return NotFound();

            return new EventResponseDto
            {
                EventId = e.EventId,
                Title = e.Title,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location,
                UserId = e.UserId,
                CreatedBy = e.User.FullName
            };
        }

        // POST: api/events
        [HttpPost]
        public async Task<ActionResult<EventResponseDto>> CreateEvent(CreateEventDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return BadRequest("Invalid UserId");

            var newEvent = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                EventDate = dto.EventDate,
                Location = dto.Location,
                UserId = dto.UserId
            };

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            var response = new EventResponseDto
            {
                EventId = newEvent.EventId,
                Title = newEvent.Title,
                Description = newEvent.Description,
                EventDate = newEvent.EventDate,
                Location = newEvent.Location,
                UserId = newEvent.UserId,
                CreatedBy = user.FullName
            };

            return CreatedAtAction(nameof(GetEvent), new { id = newEvent.EventId }, response);
        }

        // PUT: api/events/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(int id, UpdateEventDto dto)
        {
            var e = await _context.Events.FindAsync(id);
            if (e == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.Title)) e.Title = dto.Title;
            if (!string.IsNullOrEmpty(dto.Description)) e.Description = dto.Description;
            if (dto.EventDate.HasValue) e.EventDate = dto.EventDate.Value;
            if (!string.IsNullOrEmpty(dto.Location)) e.Location = dto.Location;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/events/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var e = await _context.Events.FindAsync(id);
            if (e == null) return NotFound();

            _context.Events.Remove(e);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
