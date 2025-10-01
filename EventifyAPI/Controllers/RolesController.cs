using EventifyAPI.Data;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public RolesController(EventifyDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles.ToListAsync();
            return Ok(roles);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] Role role)
        {
            if (string.IsNullOrWhiteSpace(role.Name))
                return BadRequest("Role name is required.");

            if (await _context.Roles.AnyAsync(r => r.Name == role.Name))
                return BadRequest("Role already exists.");

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return Ok(role);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound("Role not found.");

            // basic safety: don't delete role if users exist with it
            var usersWithRole = await _context.Users.AnyAsync(u => u.RoleId == id);
            if (usersWithRole) return BadRequest("Cannot delete role while users are assigned to it.");

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Role deleted." });
        }
    }
}
