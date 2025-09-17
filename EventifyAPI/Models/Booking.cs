namespace EventifyAPI.Models
{
    public class Booking
    {
        public int BookingId { get; set; }
        public DateTime BookingDate { get; set; }
        public string Status { get; set; } = "Pending";

        // Foreign keys
        public int EventId { get; set; }
        public Event Event { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int EventServiceProviderId { get; set; }
        public EventServiceProvider EventServiceProvider { get; set; }

        // Relationships
        public ICollection<Payment> Payments { get; set; }
    }
}
