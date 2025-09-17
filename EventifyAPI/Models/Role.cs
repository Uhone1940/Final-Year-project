namespace EventifyAPI.Models
{
    public class Role
    {
        public int RoleId { get; set; }
        public string Name { get; set; } = string.Empty;

        // Relationships
        public ICollection<User> Users { get; set; }
    }
}
