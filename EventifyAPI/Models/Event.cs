namespace EventifyAPI.Models
{
    public class Event
    {
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Foreign keys
        public int UserId { get; set; }
        public User User { get; set; }

        // Relationships
        public ICollection<Booking> Bookings { get; set; }
    }
}
