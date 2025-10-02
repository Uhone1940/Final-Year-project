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
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public PaymentsController(EventifyDbContext context)
        {
            _context = context;
        }

        // Create a payment for a booking (Customer)
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreatePayment(PaymentDto.CreatePayment dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == dto.BookingId && b.UserId == userId);
            if (booking == null) return BadRequest("Booking not found or not owned by you.");

            var payment = new Payment
            {
                BookingId = dto.BookingId,
                Amount = dto.Amount,
                Currency = dto.Currency,
                PaidAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            var resp = new PaymentDto.PaymentResponse
            {
                PaymentId = payment.PaymentId,
                BookingId = payment.BookingId,
                Amount = payment.Amount,
                Currency = payment.Currency,
                PaidAt = payment.PaidAt,
                ProviderTransactionId = dto.ProviderTransactionId
            };

            return Ok(resp);
        }

        // Get payments for a booking (customer or admin)
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetPaymentsForBooking(int bookingId)
        {
            var payments = await _context.Payments
                .Where(p => p.BookingId == bookingId)
                .Select(p => new PaymentDto.PaymentResponse
                {
                    PaymentId = p.PaymentId,
                    BookingId = p.BookingId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaidAt = p.PaidAt,
                    ProviderTransactionId = null
                })
                .ToListAsync();

            if (!payments.Any()) return NotFound("No payments found for this booking.");
            return Ok(payments);
        }

        // Get payments for logged-in user (customer)
        [HttpGet("me")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyPayments()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var payments = await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.Booking.UserId == userId)
                .Select(p => new PaymentDto.PaymentResponse
                {
                    PaymentId = p.PaymentId,
                    BookingId = p.BookingId,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    PaidAt = p.PaidAt,
                    ProviderTransactionId = null
                })
                .ToListAsync();

            return Ok(payments);
        }
    }
}
