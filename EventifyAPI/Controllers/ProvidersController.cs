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
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProviderResponseDto>>> GetProviders()
        {
            var providers = await _context.EventServiceProviders
                .Include(p => p.ServiceCategory)
                .Include(p => p.User)
                .ToListAsync();

            var response = providers.Select(p => new ProviderResponseDto
            {
                ProviderId = p.EventServiceProviderId,
                BusinessName = p.BusinessName,
                Description = p.Description,
                PricingDetails = p.PricingDetails,
                PortfolioLink = p.PortfolioLink,
                ServiceCategoryId = p.ServiceCategoryId,
                CategoryName = p.ServiceCategory.Name,
                OwnerFullName = p.User.FullName,
                OwnerEmail = p.User.Email,
                Location = p.Location,
                PhoneNumber = p.PhoneNumber,
                ProfilePictureUrl = p.ProfilePictureUrl
            }).ToList();

            return Ok(response);
        }

        // ------------------ GET PROVIDER BY ID ------------------
        [HttpGet("{id}")]
        public async Task<ActionResult<ProviderResponseDto>> GetProvider(int id)
        {
            var provider = await _context.EventServiceProviders
                .Include(p => p.ServiceCategory)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.EventServiceProviderId == id);

            if (provider == null) return NotFound();

            var response = new ProviderResponseDto
            {
                ProviderId = provider.EventServiceProviderId,
                BusinessName = provider.BusinessName,
                Description = provider.Description,
                PricingDetails = provider.PricingDetails,
                PortfolioLink = provider.PortfolioLink,
                ServiceCategoryId = provider.ServiceCategoryId,
                CategoryName = provider.ServiceCategory.Name,
                OwnerFullName = provider.User.FullName,
                OwnerEmail = provider.User.Email,
                Location = provider.Location,
                PhoneNumber = provider.PhoneNumber,
                ProfilePictureUrl = provider.ProfilePictureUrl
            };

            return Ok(response);
        }

        // ------------------ GET PROVIDERS BY CATEGORY ------------------
        [HttpGet("filter")]
        public async Task<IActionResult> GetProvidersByCategory([FromQuery] int categoryId)
        {
            var providers = await _context.EventServiceProviders
                .Include(p => p.User)
                .Include(p => p.ServiceCategory)
                .Where(p => p.ServiceCategoryId == categoryId)
                .Select(p => new ProviderResponseDto
                {
                    ProviderId = p.EventServiceProviderId,
                    BusinessName = p.BusinessName,
                    Description = p.Description,
                    PricingDetails = p.PricingDetails,
                    PortfolioLink = p.PortfolioLink,
                    ServiceCategoryId = p.ServiceCategoryId,
                    CategoryName = p.ServiceCategory.Name,
                    OwnerFullName = p.User.FullName,
                    OwnerEmail = p.User.Email,
                    Location = p.Location,
                    PhoneNumber = p.PhoneNumber,
                    ProfilePictureUrl = p.ProfilePictureUrl
                })
                .ToListAsync();

            if (!providers.Any())
                return NotFound("No providers found for this category.");

            return Ok(providers);
        }

        // ------------------ GET LOGGED-IN PROVIDER PROFILE ------------------
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var provider = await _context.EventServiceProviders
                .Include(p => p.User)
                .Include(p => p.ServiceCategory)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (provider == null) return NotFound("Provider not found.");

            var response = new ProviderResponseDto
            {
                ProviderId = provider.EventServiceProviderId,
                BusinessName = provider.BusinessName,
                Description = provider.Description,
                PricingDetails = provider.PricingDetails,
                PortfolioLink = provider.PortfolioLink,
                ServiceCategoryId = provider.ServiceCategoryId,
                CategoryName = provider.ServiceCategory.Name,
                OwnerFullName = provider.User.FullName,
                OwnerEmail = provider.User.Email,
                Location = provider.Location,
                PhoneNumber = provider.PhoneNumber,
                ProfilePictureUrl = provider.ProfilePictureUrl
            };

            return Ok(response);
        }

        // ------------------ UPDATE LOGGED-IN PROVIDER PROFILE ------------------
        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile(UpdateProviderProfileDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var provider = await _context.EventServiceProviders
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (provider == null) return NotFound("Provider not found.");

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
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProvider(int id)
        {
            var provider = await _context.EventServiceProviders
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.EventServiceProviderId == id);

            if (provider == null)
                return NotFound("Provider not found.");

            _context.EventServiceProviders.Remove(provider);

            if (provider.User != null)
                _context.Users.Remove(provider.User);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Provider deleted successfully." });
        }
    }
}
