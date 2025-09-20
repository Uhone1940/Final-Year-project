namespace EventifyAPI.DTOs
{
    public class AdminUserResponseDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsSuspended { get; set; }

        // Provider-specific info (null for customers)
        public string? BusinessName { get; set; }
        public string? CategoryName { get; set; }
        public string? Location { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
