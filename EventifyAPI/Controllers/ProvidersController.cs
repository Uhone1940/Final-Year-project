using EventifyAPI.Data;
using EventifyAPI.DTOs;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EventifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProvidersController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public ProvidersController(EventifyDbContext context)
        {
            _context = context;
        }

        // ------------------ GET ALL PROVIDERS ------------------
        [HttpGet("get-all-providers")]
        public async Task<ActionResult<IEnumerable<ProviderResponseDto>>> GetProviders()
        {
            var providers = await _context.EventServiceProviders
                .Include(p => p.ServiceCategory)
                .Include(p => p.User)
                .ToListAsync();

            var response = providers.Select(MapToDto).ToList();
            return Ok(response);
        }

        // ------------------ GET PROVIDER BY ID ------------------
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProviderResponseDto>> GetProvider(int id)
        {
            var provider = await _context.EventServiceProviders
                .Include(p => p.ServiceCategory)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.EventServiceProviderId == id);

            if (provider == null)
                return NotFound(new { Message = "Provider not found." });

            return Ok(MapToDto(provider));
        }

        // ------------------ GET PROVIDERS BY CATEGORY ------------------
        [HttpGet("filter")]
        public async Task<IActionResult> GetProvidersByCategory([FromQuery] int categoryId)
        {
            if (categoryId <= 0)
                return BadRequest(new { Message = "Invalid category ID." });

            var providers = await _context.EventServiceProviders
                .Include(p => p.User)
                .Include(p => p.ServiceCategory)
                .Where(p => p.ServiceCategoryId == categoryId)
                .ToListAsync();

            if (!providers.Any())
                return NotFound(new { Message = "No providers found for this category." });

            var response = providers.Select(MapToDto).ToList();
            return Ok(response);
        }

        // ------------------ GET LOGGED-IN PROVIDER PROFILE ------------------
        [Authorize(Roles = "ServiceProvider")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var provider = await _context.EventServiceProviders
                .Include(p => p.User)
                .Include(p => p.ServiceCategory)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (provider == null)
                return NotFound(new { Message = "Provider profile not found." });

            return Ok(MapToDto(provider));
        }

        // ------------------ UPDATE LOGGED-IN PROVIDER PROFILE ------------------
        [Authorize(Roles = "ServiceProvider")]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProviderProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var provider = await _context.EventServiceProviders
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (provider == null)
                return NotFound(new { Message = "Provider profile not found." });

            provider.Description = dto.Description ?? provider.Description;
            provider.PricingDetails = dto.PricingDetails ?? provider.PricingDetails;
            provider.PortfolioLink = dto.PortfolioLink ?? provider.PortfolioLink;
            provider.Location = dto.Location ?? provider.Location;
            provider.PhoneNumber = dto.PhoneNumber ?? provider.PhoneNumber;
            provider.ProfilePictureUrl = dto.ProfilePictureUrl ?? provider.ProfilePictureUrl;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Profile updated successfully." });
        }

        // ------------------ DELETE PROVIDER (ADMIN ONLY) ------------------
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProvider(int id)
        {
            var provider = await _context.EventServiceProviders
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.EventServiceProviderId == id);

            if (provider == null)
                return NotFound(new { Message = "Provider not found." });

            _context.EventServiceProviders.Remove(provider);

            if (provider.User != null)
                _context.Users.Remove(provider.User);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Provider deleted successfully." });
        }

        // ------------------ HELPER METHOD ------------------
        private static ProviderResponseDto MapToDto(EventServiceProvider p) =>
            new ProviderResponseDto
            {
                ProviderId = p.EventServiceProviderId,
                BusinessName = p.BusinessName,
                Description = p.Description,
                PricingDetails = p.PricingDetails,
                PortfolioLink = p.PortfolioLink,
                ServiceCategoryId = p.ServiceCategoryId,
                CategoryName = p.ServiceCategory?.Name,
                OwnerFullName = p.User?.FullName,
                OwnerEmail = p.User?.Email,
                Location = p.Location,
                PhoneNumber = p.PhoneNumber,
                ProfilePictureUrl = p.ProfilePictureUrl
            };
    }
}
