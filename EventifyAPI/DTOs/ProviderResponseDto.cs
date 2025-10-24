namespace EventifyAPI.DTOs
{
    public class ProviderResponseDto
    {
        public int ProviderId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string Description { get; set; }
        public string PricingDetails { get; set; }
        public string? PortfolioLink { get; set; }
        public int ServiceCategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string OwnerFullName { get; set; } = string.Empty;
        public string OwnerEmail { get; set; } = string.Empty;

        // optional fields
        public string Location { get; set; }
        public string PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}
