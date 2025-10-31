namespace EventifyAPI.DTOs
{
    public class NotificationDto
    {
        public int NotificationId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
        public int UserId { get; set; }
    }

    public class CreateNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int UserId { get; set; }
    }

    public class UpdateNotificationDto
    {
        public bool IsRead { get; set; }
    }

    public class CreateBulkNotificationDto
    {
        public string Title { get; set; } = string.Empty; 
        public string Message { get; set; } = string.Empty;
        public string RecipientType { get; set; } = string.Empty; // "all", "providers", "customers"
    }
}
