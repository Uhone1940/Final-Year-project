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
    public class BookingsController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public BookingsController(EventifyDbContext context)
        {
            _context = context;
        }

        // ------------------ CREATE BOOKING ------------------
        [Authorize(Roles = "Customer")]
        [HttpPost("create-booking")]
        public async Task<IActionResult> CreateBooking(CreateBookingDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Validate event
            var evt = await _context.Events.FirstOrDefaultAsync(e => e.EventId == dto.EventId && e.UserId == userId);
            if (evt == null)
                return BadRequest("Event not found or does not belong to you.");

            // Validate provider
            var provider = await _context.EventServiceProviders.FindAsync(dto.EventServiceProviderId);
            if (provider == null)
                return BadRequest("Service provider not found.");

            var booking = new Booking
            {
                EventId = dto.EventId,
                EventServiceProviderId = dto.EventServiceProviderId,
                UserId = userId,
                BookingDate = dto.BookingDate,
                Status = "Pending"
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Booking created successfully.", BookingId = booking.BookingId });
        }

        // ------------------ UPDATE BOOKING STATUS ------------------
        [Authorize(Roles = "EventServiceProvider,Admin")]
        [HttpPut("{bookingId}/status")]
        public async Task<IActionResult> UpdateBookingStatus(int bookingId, UpdateBookingStatusDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
            if (provider == null && !User.IsInRole("Admin"))
                return Unauthorized("Not authorized to update this booking.");

            var booking = await _context.Bookings
                .Include(b => b.Event)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId &&
                    (b.EventServiceProviderId == provider.EventServiceProviderId || User.IsInRole("Admin")));

            if (booking == null) return NotFound("Booking not found.");

            booking.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Booking status updated successfully.", Status = booking.Status });
        }

        // ------------------ GET BOOKINGS FOR LOGGED-IN USER ------------------
        [Authorize]
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var bookings = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.EventServiceProvider)
                    .ThenInclude(p => p.User)
                .Include(b => b.User)
                .Where(b => b.UserId == userId || b.EventServiceProvider.UserId == userId)
                .Select(b => new BookingsResponseDto
                {
                    BookingId = b.BookingId,
                    BookingDate = b.BookingDate,
                    Status = b.Status,

                    EventId = b.Event.EventId,
                    EventName = b.Event.Name,
                    EventDate = b.Event.Date,
                    EventLocation = b.Event.Location,

                    ProviderId = b.EventServiceProvider.EventServiceProviderId,
                    ProviderBusinessName = b.EventServiceProvider.BusinessName,
                    ProviderEmail = b.EventServiceProvider.User.Email,

                    CustomerId = b.User.UserId,
                    CustomerFullName = b.User.FullName,
                    CustomerEmail = b.User.Email
                })
                .ToListAsync();

            return Ok(bookings);
        }

        // ------------------ GET BOOKINGS FOR A SPECIFIC PROVIDER ------------------
        [Authorize(Roles = "EventServiceProvider,Admin")]
        [HttpGet("provider/{providerId}")]
        public async Task<IActionResult> GetBookingsForProvider(int providerId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.EventServiceProvider)
                    .ThenInclude(p => p.User)
                .Include(b => b.User)
                .Where(b => b.EventServiceProviderId == providerId)
                .Select(b => new BookingsResponseDto
                {
                    BookingId = b.BookingId,
                    BookingDate = b.BookingDate,
                    Status = b.Status,

                    EventId = b.Event.EventId,
                    EventName = b.Event.Name,
                    EventDate = b.Event.Date,
                    EventLocation = b.Event.Location,

                    ProviderId = b.EventServiceProvider.EventServiceProviderId,
                    ProviderBusinessName = b.EventServiceProvider.BusinessName,
                    ProviderEmail = b.EventServiceProvider.User.Email,

                    CustomerId = b.User.UserId,
                    CustomerFullName = b.User.FullName,
                    CustomerEmail = b.User.Email
                })
                .ToListAsync();

            return Ok(bookings);
        }

        // ------------------ DELETE BOOKING ------------------
        [Authorize(Roles = "Customer")]
        [HttpDelete("{bookingId}")]
        public async Task<IActionResult> DeleteBooking(int bookingId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId && b.UserId == userId);
            if (booking == null) return NotFound("Booking not found or you don't have permission.");

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Booking deleted successfully." });
        }

        // ------------------ GET BOOKING BY ID ------------------
        [Authorize]
        [HttpGet("{bookingId}")]
        public async Task<ActionResult<BookingsResponseDto>> GetBooking(int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.EventServiceProvider)
                    .ThenInclude(p => p.User)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (booking == null) return NotFound();

            var response = new BookingsResponseDto
            {
                BookingId = booking.BookingId,
                BookingDate = booking.BookingDate,
                Status = booking.Status,

                EventId = booking.Event.EventId,
                EventName = booking.Event.Name,
                EventDate = booking.Event.Date,
                EventLocation = booking.Event.Location,

                ProviderId = booking.EventServiceProvider.EventServiceProviderId,
                ProviderBusinessName = booking.EventServiceProvider.BusinessName,
                ProviderEmail = booking.EventServiceProvider.User.Email,

                CustomerId = booking.User.UserId,
                CustomerFullName = booking.User.FullName,
                CustomerEmail = booking.User.Email
            };

            return Ok(response);
        }

        // ------------------ GET BOOKINGS FOR A SPECIFIC EVENT ------------------
        [Authorize(Roles = "Customer")]
        [HttpGet("event/{eventId}")]
        public async Task<IActionResult> GetBookingsForEvent(int eventId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Verify the event belongs to the user
            var eventExists = await _context.Events
                .AnyAsync(e => e.EventId == eventId && e.UserId == userId);

            if (!eventExists)
                return NotFound("Event not found or you don't have permission.");

            var bookings = await _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.EventServiceProvider)
                    .ThenInclude(p => p.ServiceCategory)
                .Include(b => b.EventServiceProvider.User)
                .Include(b => b.User)
                .Where(b => b.EventId == eventId)
                .Select(b => new BookingsResponseDto
                {
                    BookingId = b.BookingId,
                    BookingDate = b.BookingDate,
                    Status = b.Status,

                    EventId = b.EventId,
                    EventName = b.Event.Name,
                    EventDate = b.Event.Date,
                    EventLocation = b.Event.Location,

                    ProviderId = b.EventServiceProviderId,
                    ProviderBusinessName = b.EventServiceProvider.BusinessName,
                    ProviderEmail = b.EventServiceProvider.User.Email,

                    CustomerId = b.UserId,
                    CustomerFullName = b.User.FullName,
                    CustomerEmail = b.User.Email
                })
                .ToListAsync();

            return Ok(bookings);
        }

        // ------------------ FILTER BOOKINGS ------------------
        [Authorize]
        [HttpGet("filter")]
        public async Task<IActionResult> FilterBookings(
         [FromQuery] string? status,
         [FromQuery] DateTime? startDate,
         [FromQuery] DateTime? endDate,
         [FromQuery] string? sortBy = "BookingDate",
         [FromQuery] bool descending = false,
         [FromQuery] int page = 1,
         [FromQuery] int pageSize = 10)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var query = _context.Bookings
                .Include(b => b.Event)
                .Include(b => b.EventServiceProvider).ThenInclude(p => p.User)
                .Include(b => b.User) // Customer
                .AsQueryable();

            // Filter by role
            if (User.IsInRole("EventServiceProvider"))
            {
                var provider = await _context.EventServiceProviders.FirstOrDefaultAsync(p => p.UserId == userId);
                if (provider == null) return Unauthorized("Provider not found.");
                query = query.Where(b => b.EventServiceProviderId == provider.EventServiceProviderId);
            }
            else if (User.IsInRole("Customer"))
            {
                query = query.Where(b => b.UserId == userId);
            }

            // Apply filters
            if (!string.IsNullOrEmpty(status))
                query = query.Where(b => b.Status == status);
            if (startDate.HasValue)
                query = query.Where(b => b.BookingDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(b => b.BookingDate <= endDate.Value);

            // Apply sorting
            query = sortBy switch
            {
                "BookingDate" => descending ? query.OrderByDescending(b => b.BookingDate) : query.OrderBy(b => b.BookingDate),
                "Status" => descending ? query.OrderByDescending(b => b.Status) : query.OrderBy(b => b.Status),
                "Provider" => descending ? query.OrderByDescending(b => b.EventServiceProvider.BusinessName) : query.OrderBy(b => b.EventServiceProvider.BusinessName),
                _ => query.OrderBy(b => b.BookingDate)
            };

            // Apply pagination
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
            var bookings = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookingsResponseDto
                {
                    BookingId = b.BookingId,
                    BookingDate = b.BookingDate,
                    Status = b.Status,
                    EventId = b.Event.EventId,
                    EventName = b.Event.Name,
                    EventDate = b.Event.Date,
                    EventLocation = b.Event.Location,
                    ProviderId = b.EventServiceProvider.EventServiceProviderId,
                    ProviderBusinessName = b.EventServiceProvider.BusinessName,
                    ProviderEmail = b.EventServiceProvider.User.Email,
                    CustomerId = b.User.UserId,
                    CustomerFullName = b.User.FullName,
                    CustomerEmail = b.User.Email
                })
                .ToListAsync();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                Bookings = bookings
            });
        }

    }
}
