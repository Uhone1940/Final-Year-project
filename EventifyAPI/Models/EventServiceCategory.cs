namespace EventifyAPI.Models
{
    public class EventServiceCategory
    {
        public int EventId { get; set; }
        public Event Event { get; set; }

        public int ServiceCategoryId { get; set; }
        public ServiceCategory ServiceCategory { get; set; }
    }
}
