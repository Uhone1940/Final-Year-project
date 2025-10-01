using System.ComponentModel.DataAnnotations;

namespace EventifyAPI.DTOs
{
    public static class RoleDto
    {
        public class RoleResponse
        {
            public int RoleId { get; set; }
            public string Name { get; set; } = string.Empty;
        }

        public class CreateRole
        {
            [Required]
            [StringLength(100)]
            public string Name { get; set; } = string.Empty;
        }
    }
}
