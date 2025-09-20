namespace EventifyAPI.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? Phone { get; set; }

        // Only for customers
        public string? PreferredEventTypes { get; set; }

        // Foreign keys
        public int RoleId { get; set; }
        public Role Role { get; set; }

        // New property for Suspension
        public bool IsSuspended { get; set; } = false;

        // Navigation properties
        public ICollection<Event> Events { get; set; } = new List<Event>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        // Optional navigation for providers
        public EventServiceProvider? EventServiceProvider { get; set; }
    }
}
