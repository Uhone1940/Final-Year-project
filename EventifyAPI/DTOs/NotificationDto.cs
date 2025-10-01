using System;
using System.ComponentModel.DataAnnotations;

namespace EventifyAPI.DTOs
{
    public static class NotificationDto
    {
        public class CreateNotification
        {
            [Required]
            public int UserId { get; set; }

            [Required]
            [StringLength(200)]
            public string Title { get; set; } = string.Empty;

            [Required]
            [StringLength(4000)]
            public string Body { get; set; } = string.Empty;
        }

        public class NotificationResponse
        {
            public int NotificationId { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Body { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public bool IsRead { get; set; } = false;
        }
    }
}
