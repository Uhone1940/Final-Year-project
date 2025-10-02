using EventifyAPI.Data;
using EventifyAPI.DTOs;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly EventifyDbContext _context;

        public CategoriesController(EventifyDbContext context)
        {
            _context = context;
        }

        // ------------------ GET ALL ------------------
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceCategoryDto.ServiceCategoryResponse>>> GetCategories([FromQuery] bool includeDeleted = false)
        {
            var query = _context.ServiceCategories
                .Include(c => c.EventServiceProviders)
                .AsQueryable();

            if (!includeDeleted)
                query = query.Where(c => !c.IsDeleted);

            var categories = await query
                .Select(c => new ServiceCategoryDto.ServiceCategoryResponse
                {
                    ServiceCategoryId = c.ServiceCategoryId,
                    Name = c.Name,
                    ProviderCount = c.EventServiceProviders != null ? c.EventServiceProviders.Count(p => !p.IsDeleted) : 0
                })
                .ToListAsync();

            return Ok(categories);
        }

        // ------------------ GET ONE ------------------
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceCategoryDto.ServiceCategoryResponse>> GetCategory(int id)
        {
            var c = await _context.ServiceCategories
                .Include(sc => sc.EventServiceProviders)
                .FirstOrDefaultAsync(x => x.ServiceCategoryId == id && !x.IsDeleted);

            if (c == null) return NotFound("Service category not found.");

            var resp = new ServiceCategoryDto.ServiceCategoryResponse
            {
                ServiceCategoryId = c.ServiceCategoryId,
                Name = c.Name,
                ProviderCount = c.EventServiceProviders?.Count(p => !p.IsDeleted) ?? 0
            };

            return Ok(resp);
        }

        // ------------------ CREATE (Admin) ------------------
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] ServiceCategoryDto.CreateServiceCategory dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var normalized = dto.Name.Trim();
            var existing = await _context.ServiceCategories
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Name.ToLower() == normalized.ToLower());

            if (existing != null)
            {
                if (existing.IsDeleted)
                {
                    existing.IsDeleted = false;
                    existing.DeletedAt = null;
                    await _context.SaveChangesAsync();

                    var restoredResp = new ServiceCategoryDto.ServiceCategoryResponse
                    {
                        ServiceCategoryId = existing.ServiceCategoryId,
                        Name = existing.Name,
                        ProviderCount = existing.EventServiceProviders?.Count(p => !p.IsDeleted) ?? 0
                    };
                    return Ok(new { Message = "Category restored.", Category = restoredResp });
                }

                return BadRequest("A service category with that name already exists.");
            }

            var category = new ServiceCategory
            {
                Name = normalized,
                IsDeleted = false
            };

            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();

            var resp = new ServiceCategoryDto.ServiceCategoryResponse
            {
                ServiceCategoryId = category.ServiceCategoryId,
                Name = category.Name,
                ProviderCount = 0
            };

            return CreatedAtAction(nameof(GetCategory), new { id = category.ServiceCategoryId }, resp);
        }

        // ------------------ UPDATE (Admin) ------------------
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] ServiceCategoryDto.UpdateServiceCategory dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null || category.IsDeleted) return NotFound("Service category not found.");

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var newName = dto.Name.Trim();
                var conflict = await _context.ServiceCategories
                    .IgnoreQueryFilters()
                    .AnyAsync(x => x.ServiceCategoryId != id && x.Name.ToLower() == newName.ToLower() && !x.IsDeleted);
                if (conflict) return BadRequest("Another active category with that name already exists.");

                category.Name = newName;
            }

            await _context.SaveChangesAsync();

            var resp = new ServiceCategoryDto.ServiceCategoryResponse
            {
                ServiceCategoryId = category.ServiceCategoryId,
                Name = category.Name,
                ProviderCount = category.EventServiceProviders?.Count(p => !p.IsDeleted) ?? 0
            };

            return Ok(resp);
        }

        // ------------------ SOFT DELETE (Admin) ------------------
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteCategory(int id)
        {
            var category = await _context.ServiceCategories
                .Include(c => c.EventServiceProviders)
                .FirstOrDefaultAsync(x => x.ServiceCategoryId == id);

            if (category == null) return NotFound("Service category not found.");
            if (category.IsDeleted) return BadRequest("Category already deleted.");

            if (category.EventServiceProviders != null && category.EventServiceProviders.Any(p => !p.IsDeleted))
            {
                return BadRequest("Cannot delete category while active providers are assigned.");
            }

            category.IsDeleted = true;
            category.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Category soft-deleted." });
        }

        // ------------------ LIST DELETED (Admin) ------------------
        [HttpGet("deleted")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDeletedCategories()
        {
            var deleted = await _context.ServiceCategories
                .Where(c => c.IsDeleted)
                .Select(c => new
                {
                    c.ServiceCategoryId,
                    c.Name,
                    c.DeletedAt
                })
                .ToListAsync();

            return Ok(deleted);
        }

        // ------------------ RESTORE (Admin) ------------------
        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreCategory(int id)
        {
            var category = await _context.ServiceCategories
                .FirstOrDefaultAsync(c => c.ServiceCategoryId == id);

            if (category == null) return NotFound("Service category not found.");
            if (!category.IsDeleted) return BadRequest("Category is not deleted.");

            category.IsDeleted = false;
            category.DeletedAt = null;
            await _context.SaveChangesAsync();

            var resp = new ServiceCategoryDto.ServiceCategoryResponse
            {
                ServiceCategoryId = category.ServiceCategoryId,
                Name = category.Name,
                ProviderCount = category.EventServiceProviders?.Count(p => !p.IsDeleted) ?? 0
            };

            return Ok(new { Message = "Category restored.", Category = resp });
        }

        // ------------------ PURGE (Admin - permanent) ------------------
        [HttpDelete("{id}/purge")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PurgeCategory(int id)
        {
            var category = await _context.ServiceCategories
                .IgnoreQueryFilters()
                .Include(c => c.EventServiceProviders)
                .FirstOrDefaultAsync(x => x.ServiceCategoryId == id);

            if (category == null) return NotFound("Service category not found.");
            if (!category.IsDeleted) return BadRequest("Must soft-delete before purging.");

            if (category.EventServiceProviders != null && category.EventServiceProviders.Any())
                return BadRequest("Cannot purge category while providers exist. Remove providers first.");

            _context.ServiceCategories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Category permanently deleted." });
        }
    }
}
