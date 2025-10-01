using System;
using System.ComponentModel.DataAnnotations;

namespace EventifyAPI.DTOs
{
    public static class ReviewDto
    {
        public class CreateReview
        {
            [Required]
            public int EventServiceProviderId { get; set; }

            [Required]
            [Range(1, 5)]
            public int Rating { get; set; }

            [StringLength(2000)]
            public string? Comment { get; set; }
        }

        public class ReviewResponse
        {
            public int ReviewId { get; set; }
            public int ProviderId { get; set; }
            public int Rating { get; set; }
            public string? Comment { get; set; }
            public DateTime CreatedAt { get; set; }
            public int UserId { get; set; }
            public string UserFullName { get; set; } = string.Empty;
        }
    }
}
