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

        // ------------------ GET ALL EVENTS (MY EVENTS) ------------------
        [Authorize(Roles = "Customer")]
        [HttpGet("get-all-events")]
        public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetEvents()
        {
            // Get the authenticated user's ID
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // ALWAYS filter by the authenticated user
            var events = await _context.Events
                .Include(e => e.User)
                .Include(e => e.ServicesNeeded)
                    .ThenInclude(esc => esc.ServiceCategory)
                .Include(e => e.Bookings)
                .Where(e => e.UserId == userId)  // ? CRITICAL: Only get user's own events
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            var response = events.Select(e => new EventResponseDto
            {
                EventId = e.EventId,
                Name = e.Name,
                EventType = e.EventType,
                Date = e.Date,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Location = e.Location,
                FullAddress = e.FullAddress,
                ExpectedGuests = e.ExpectedGuests,
                Description = e.Description,
                UserId = e.UserId,
                UserFullName = e.User.FullName,
                BookingCount = e.Bookings?.Count ?? 0,
                ServicesNeeded = e.ServicesNeeded
                    .Select(s => s.ServiceCategory.Name)
                    .ToList()
            }).ToList();

            return Ok(response);
        }


        // ------------------ GET ALL EVENTS (ADMIN ONLY) ------------------
        [Authorize(Roles = "Admin,SystemAdmin")]
        [HttpGet("admin/all-events")]
        public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetAllEventsAdmin([FromQuery] int? userId = null)
        {
            var query = _context.Events
                .Include(e => e.User)
                .Include(e => e.ServicesNeeded)
                    .ThenInclude(esc => esc.ServiceCategory)
                .Include(e => e.Bookings)
                .AsQueryable();

            if (userId.HasValue)
                query = query.Where(e => e.UserId == userId.Value);

            var events = await query.OrderByDescending(e => e.Date).ToListAsync();

            var response = events.Select(e => new EventResponseDto
            {
                EventId = e.EventId,
                Name = e.Name,
                EventType = e.EventType,
                Date = e.Date,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Location = e.Location,
                FullAddress = e.FullAddress,
                ExpectedGuests = e.ExpectedGuests,
                Description = e.Description,
                UserId = e.UserId,
                UserFullName = e.User.FullName,
                BookingCount = e.Bookings?.Count ?? 0,
                ServicesNeeded = e.ServicesNeeded
                    .Select(s => s.ServiceCategory.Name)
                    .ToList()
            }).ToList();

            return Ok(response);
        }

        // ------------------ GET SINGLE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpGet("{id}")]
        public async Task<ActionResult<EventResponseDto>> GetEvent(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var e = await _context.Events
                .Include(ev => ev.User)
                .Include(ev => ev.Bookings)
                .Include(ev => ev.ServicesNeeded)
                    .ThenInclude(s => s.ServiceCategory)
                .FirstOrDefaultAsync(ev => ev.EventId == id && ev.UserId == userId);  // ? Check ownership

            if (e == null)
                return NotFound(new { message = "Event not found or you don't have permission." });

            var response = new EventResponseDto
            {
                EventId = e.EventId,
                Name = e.Name,
                EventType = e.EventType,
                Date = e.Date,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Location = e.Location,
                FullAddress = e.FullAddress,
                ExpectedGuests = e.ExpectedGuests,
                Description = e.Description,
                UserId = e.UserId,
                UserFullName = e.User.FullName,
                BookingCount = e.Bookings?.Count ?? 0,
                ServicesNeeded = e.ServicesNeeded?
                    .Select(s => s.ServiceCategory.Name)
                    .ToList() ?? new List<string>()
            };

            return Ok(response);
        }

        // ------------------ CREATE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent(CreateEventDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var newEvent = new Event
            {
                Name = dto.Name,
                EventType = dto.EventType,
                Date = dto.Date,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Location = dto.Location,
                FullAddress = dto.FullAddress,
                ExpectedGuests = dto.ExpectedGuests,
                Description = dto.Description,
                UserId = userId
            };

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            // Add selected service categories
            if (dto.ServiceCategoryIds != null && dto.ServiceCategoryIds.Any())
            {
                foreach (var catId in dto.ServiceCategoryIds)
                {
                    _context.Add(new EventServiceCategory
                    {
                        EventId = newEvent.EventId,
                        ServiceCategoryId = catId
                    });
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { Message = "Event created successfully.", EventId = newEvent.EventId });
        }

        // ------------------ UPDATE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(int id, UpdateEventDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var e = await _context.Events
                .Include(ev => ev.ServicesNeeded)
                .FirstOrDefaultAsync(ev => ev.EventId == id && ev.UserId == userId);

            if (e == null)
                return NotFound("Event not found or you are not authorized.");

            e.Name = dto.Name;
            e.EventType = dto.EventType;
            e.Date = dto.Date;
            e.StartTime = dto.StartTime;
            e.EndTime = dto.EndTime;
            e.Location = dto.Location; 
            e.FullAddress = dto.FullAddress;
            e.ExpectedGuests = dto.ExpectedGuests;
            e.Description = dto.Description;

            // Update service categories
            e.ServicesNeeded.Clear();
            if (dto.ServiceCategoryIds != null && dto.ServiceCategoryIds.Any())
            {
                foreach (var catId in dto.ServiceCategoryIds)
                {
                    e.ServicesNeeded.Add(new EventServiceCategory
                    {
                        EventId = id,
                        ServiceCategoryId = catId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Event updated successfully." });
        }

        // ------------------ DELETE EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var e = await _context.Events.FirstOrDefaultAsync(ev => ev.EventId == id && ev.UserId == userId);
            if (e == null)
                return NotFound("Event not found or you are not authorized.");

            _context.Events.Remove(e);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Event deleted successfully." });
        }
    }
}
