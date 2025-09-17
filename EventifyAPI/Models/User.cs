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

        // Navigation properties
        public ICollection<Event> Events { get; set; }
        public ICollection<Booking> Bookings { get; set; }
        public ICollection<Review> Reviews { get; set; }

    }
}
