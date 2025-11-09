namespace EventifyAPI.Models
{
    public class Notification
    {
        public int NotificationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        // New fields for event notifications
        public string? Type { get; set; } // "booking", "cancellation", "review", "admin", "general"
        public int? RelatedEntityId { get; set; } // BookingId, ReviewId, etc.

        // Foreign keys
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
