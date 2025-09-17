namespace EventifyAPI.Models
{
    public class ServiceCategory
    {
        public int ServiceCategoryId { get; set; }
        public string Name { get; set; } = string.Empty;

        // Relationships
        public ICollection<EventServiceProvider> EventServiceProviders { get; set; }
    }
}
