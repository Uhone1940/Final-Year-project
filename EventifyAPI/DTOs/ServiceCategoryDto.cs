namespace EventifyAPI.DTOs
{
    public class ServiceCategoryDto
    {
        public class CreateServiceCategory
        {
            public string Name { get; set; } = string.Empty;
        }

        public class UpdateServiceCategory
        {
            public string? Name { get; set; }
        }

        public class ServiceCategoryResponse
        {
            public int ServiceCategoryId { get; set; }
            public string Name { get; set; } = string.Empty;
            public int ProviderCount { get; set; }
        }
    }
}
