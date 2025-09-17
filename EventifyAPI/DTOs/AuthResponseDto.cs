namespace EventifyAPI.DTOs
{
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public string? Role { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
    }
}
