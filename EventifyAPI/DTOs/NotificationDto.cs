namespace EventifyAPI.DTOs
{
    public class NotificationDto
    {
        public int NotificationId { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
        public int UserId { get; set; }
    }

    public class CreateNotificationDto
    {
        public string Message { get; set; } = string.Empty;
        public int UserId { get; set; }
    }

    public class UpdateNotificationDto
    {
        public bool IsRead { get; set; }
    }
}
