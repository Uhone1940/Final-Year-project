namespace EventifyAPI.DTOs
{
    public class CreateEventDto
    {
        public string Name { get; set; }
        public string EventType { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Location { get; set; } = string.Empty;
        public string FullAddress { get; set; }
        public int ExpectedGuests { get; set; }
        public string Description { get; set; }
        public List<int> ServiceCategoryIds { get; set; } = new();
    }

    public class UpdateEventDto : CreateEventDto { }

    public class EventResponseDto
    {
        public int EventId { get; set; }
        public string Name { get; set; }
        public string EventType { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Location { get; set; }
        public string FullAddress { get; set; }
        public int ExpectedGuests { get; set; }
        public string Description { get; set; }

        public int UserId { get; set; }
        public string UserFullName { get; set; }

        public List<string> ServicesNeeded { get; set; } = new();
        public int BookingCount { get; set; }
    }
}
