namespace EventifyAPI.DTOs
{
    public class AvailabilityDto
    {
        public int AvailabilityId { get; set; }
        public DateTime AvailableDate { get; set; }
        public bool IsBooked { get; set; }
        public int EventServiceProviderId { get; set; }
    }

    public class CreateAvailabilityDto
    {
        public DateTime AvailableDate { get; set; }
        public int EventServiceProviderId { get; set; }
    }

    public class UpdateAvailabilityDto
    {
        public DateTime AvailableDate { get; set; }
        public bool IsBooked { get; set; }
    }
}
