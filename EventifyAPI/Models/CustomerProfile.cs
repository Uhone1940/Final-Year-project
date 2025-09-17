namespace EventifyAPI.Models
{
    public class CustomerProfile
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? PreferredEventTypes { get; set; }
    }
}
