using EventifyAPI.Models;

namespace EventifyAPI.DTOs
{
    public class ReportResponseDto
    {
        public int ReportId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public ReportStatus Status { get; set; }
    }
}
