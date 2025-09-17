namespace EventifyAPI.Models
{
    public class Review
    {
        public int ReviewId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;

        // Foreign keys
        public int UserId { get; set; }
        public User User { get; set; }

        public int EventServiceProviderId { get; set; }
        public EventServiceProvider EventServiceProvider { get; set; }
    }
}
