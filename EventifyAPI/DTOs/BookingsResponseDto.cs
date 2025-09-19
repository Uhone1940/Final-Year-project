namespace EventifyAPI.DTOs
{
    public class BookingsResponseDto
    {
        public int BookingId { get; set; }
        public DateTime BookingDate { get; set; }
        public string Status { get; set; }

        // Event details
        public int EventId { get; set; }
        public string EventName { get; set; }
        public DateTime EventDate { get; set; }
        public string EventLocation { get; set; }

        // Provider details
        public int ProviderId { get; set; }
        public string ProviderBusinessName { get; set; }
        public string ProviderEmail { get; set; }

        // Customer details
        public int CustomerId { get; set; }
        public string CustomerFullName { get; set; }
        public string CustomerEmail { get; set; }
    }
}
