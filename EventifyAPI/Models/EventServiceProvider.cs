namespace EventifyAPI.Models
{
    public class EventServiceProvider
    {
        public int EventServiceProviderId { get; set; }
        public string BusinessName { get; set; } = string.Empty;

        // Foreign key to ServiceCategory
        public int ServiceCategoryId { get; set; }
        public ServiceCategory ServiceCategory { get; set; }

        // Optional Fields, can be updated when a user is setting their profile
        public string? Description { get; set; }
        public string? PricingDetails { get; set; }
        public string? PortfolioLink { get; set; }
        public string? Location { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }

        // Foreign key to User
        public int UserId { get; set; }
        public User User { get; set; }

        // Navigation
        //public ICollection<ServicePackage> Packages { get; set; }, we don't have this yet, we can add it if we want
        public ICollection<Booking> Bookings { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<Availability> Availabilities { get; set; }

    }
}
