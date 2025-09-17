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
    public class ReportsController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public ReportsController(EventifyDbContext context)
        {
            _context = context;
        }

        // ------------------ SUBMIT REPORT (any logged-in user) ------------------
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateReport(CreateReportDto dto)
        {
            var report = new Report
            {
                Title = dto.Title,
                Content = dto.Content,
                GeneratedAt = DateTime.UtcNow,
                ReportedUserId = dto.ReportedUserId,
                EventId = dto.EventId,
                BookingId = dto.BookingId
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Report submitted successfully.", ReportId = report.ReportId });
        }

        // ------------------ GET ALL REPORTS (admin only) ------------------
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetReports()
        {
            var reports = await _context.Reports
                .Include(r => r.ReportedUser)
                .Include(r => r.Event)
                .Include(r => r.Booking)
                .ToListAsync();

            return Ok(reports);
        }

        // ------------------ GET A SINGLE REPORT BY ID (admin only) ------------------
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            var report = await _context.Reports
                .Include(r => r.ReportedUser)
                .Include(r => r.Event)
                .Include(r => r.Booking)
                .FirstOrDefaultAsync(r => r.ReportId == id);

            if (report == null) return NotFound("Report not found.");

            return Ok(report);
        }

        // ------------------ UPDATE REPORT (admin only) ------------------
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReport(int id, UpdateReportDto dto)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null) return NotFound("Report not found.");

            // Update fields only if new values are provided
            report.Title = dto.Title ?? report.Title;
            report.Content = dto.Content ?? report.Content;
            report.Status = dto.Status ?? report.Status;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Report updated successfully.", report });
        }


        // ------------------ DELETE A REPORT (admin only) ------------------
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null) return NotFound("Report not found.");

            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Report deleted successfully." });
        }
    }
}
