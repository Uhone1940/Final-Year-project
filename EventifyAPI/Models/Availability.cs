namespace EventifyAPI.Models
{
    public class Availability
    {
        public int AvailabilityId { get; set; }
        public DateTime AvailableDate { get; set; }
        public bool IsBooked { get; set; }

        // Foreign key
        public int EventServiceProviderId { get; set; }
        public EventServiceProvider EventServiceProvider { get; set; }
    }
}
