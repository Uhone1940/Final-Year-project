namespace EventifyAPI.DTOs
{
    public class CreateReportDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        // Optional targets
        public int? ReportedUserId { get; set; }
        public int? EventId { get; set; }
        public int? BookingId { get; set; }
    }
}
