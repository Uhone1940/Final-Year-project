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
    public class PaymentsController : ControllerBase
    {
        private readonly EventifyDbContext _context;
        public PaymentsController(EventifyDbContext context) => _context = context;

        // Customer makes a payment for a booking they own
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto)
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == dto.BookingId && b.UserId == userId);
            if (booking == null) return BadRequest("Booking not found or not owned by you.");

            var payment = new Payment
            {
                BookingId = dto.BookingId,
                Amount = dto.Amount,
                Method = dto.Method,
                PaymentDate = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            var resp = new PaymentDto
            {
                PaymentId = payment.PaymentId,
                Amount = payment.Amount,
                Method = payment.Method,
                PaymentDate = payment.PaymentDate,
                BookingId = payment.BookingId
            };

            return CreatedAtAction(nameof(GetPayment), new { id = resp.PaymentId }, resp);
        }

        // Get payment by id (authorized: owner or admin)
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetPayment(int id)
        {
            var pay = await _context.Payments.Include(p => p.Booking).FirstOrDefaultAsync(p => p.PaymentId == id);
            if (pay == null) return NotFound();

            // owner or admin allowed
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _ = int.TryParse(uid, out var userId);
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);

            if (user?.Role?.Name != "Admin" && pay.Booking.UserId != userId)
                return Forbid();

            var resp = new PaymentDto
            {
                PaymentId = pay.PaymentId,
                Amount = pay.Amount,
                Method = pay.Method,
                PaymentDate = pay.PaymentDate,
                BookingId = pay.BookingId
            };

            return Ok(resp);
        }

        // Get payments for a booking (owner or admin)
        [HttpGet("booking/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentsForBooking(int bookingId)
        {
            var list = await _context.Payments
                .Where(p => p.BookingId == bookingId)
                .Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    Amount = p.Amount,
                    Method = p.Method,
                    PaymentDate = p.PaymentDate,
                    BookingId = p.BookingId
                }).ToListAsync();

            if (!list.Any()) return NotFound("No payments found for this booking.");
            return Ok(list);
        }

        // Customer gets their payments
        [HttpGet("me")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyPayments()
        {
            var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var payments = await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.Booking.UserId == userId)
                .Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    Amount = p.Amount,
                    Method = p.Method,
                    PaymentDate = p.PaymentDate,
                    BookingId = p.BookingId
                }).ToListAsync();

            return Ok(payments);
        }
    }
}
