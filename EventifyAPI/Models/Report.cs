namespace EventifyAPI.Models
{
    public class Report
    {
        public int ReportId { get; set; }

        // Basic info
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        // Who submitted the report
        public int ReporterId { get; set; }
        public User Reporter { get; set; }

        // Who/what the report is about
        public int? ReportedUserId { get; set; }
        public User? ReportedUser { get; set; }

        public int? EventId { get; set; }
        public Event? Event { get; set; }

        public int? BookingId { get; set; }
        public Booking? Booking { get; set; }

        // Status for admins
        public ReportStatus Status { get; set; } = ReportStatus.Pending; // Pending, Resolved, Dismissed
    }
}
