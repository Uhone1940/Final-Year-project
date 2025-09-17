namespace EventifyAPI.DTOs
{
    public class RegisterProviderDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        //public string Category { get; set; } = string.Empty;

        // Provider must select a category from existing categories
        public int ServiceCategoryId { get; set; }

        // Optional details, you can provide them later on when you update your profile
        public string? Description { get; set; }
        public string? PricingDetails { get; set; }
        public string? PortfolioLink { get; set; }
        public string? Location { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}
