namespace EventifyAPI.Models
{
    public class ServiceCategory
    {
        public int ServiceCategoryId { get; set; }
        public string Name { get; set; } = string.Empty;

        // Soft-delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        // Relationships
        public ICollection<EventServiceProvider> EventServiceProviders { get; set; } = new List<EventServiceProvider>();
        // for the many-to-many with Events
        public ICollection<EventServiceCategory> EventServiceCategories { get; set; } = new List<EventServiceCategory>();
    }
}
