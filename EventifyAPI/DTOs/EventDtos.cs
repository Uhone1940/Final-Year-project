namespace EventifyAPI.DTOs
{
    // Create Event DTO
    public class CreateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;

        // Link event to a customer (creator)
        public int UserId { get; set; }
    }

    // Update Event DTO
    public class UpdateEventDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? EventDate { get; set; }
        public string? Location { get; set; }
    }

    // Response DTO
    public class EventResponseDto
    {
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;

        public int UserId { get; set; }
        public string CreatedBy { get; set; } = string.Empty; // from User
    }
}
