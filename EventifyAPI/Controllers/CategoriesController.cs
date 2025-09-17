using EventifyAPI.Data;
using EventifyAPI.Models;
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

        // GET: api/categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceCategory>>> GetCategories()
        {
            var categories = await _context.ServiceCategories.ToListAsync();
            return Ok(categories);
        }

        // GET: api/categories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceCategory>> GetCategory(int id)
        {
            var category = await _context.ServiceCategories.FindAsync(id);

            if (category == null)
                return NotFound();

            return Ok(category);
        }
    }
}
