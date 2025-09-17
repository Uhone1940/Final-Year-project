using Microsoft.AspNetCore.Identity;

namespace EventifyAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string? Role { get; set; } // Admin, Customer, Provider
    }
}
