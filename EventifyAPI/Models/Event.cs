namespace EventifyAPI.Models
{
    public class Event
    {
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Location { get; set; } 
        public string FullAddress { get; set; } = string.Empty;
        public int ExpectedGuests { get; set; }
        public string Description { get; set; } = string.Empty;

        // Relationships
        public ICollection<EventServiceCategory> EventServiceCategories { get; set; }
        public ICollection<EventServiceCategory> ServicesNeeded { get; set; }


        // Foreign key
        public int UserId { get; set; }
        public User User { get; set; }

        public ICollection<Booking> Bookings { get; set; }
    }

}
