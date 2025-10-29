using EventifyAPI.Data;
using EventifyAPI.DTOs;
using EventifyAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace EventifyAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly EventifyDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(EventifyDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ----------------- REGISTER CUSTOMER -----------------
        [HttpPost("register-customer")]
        public async Task<IActionResult> RegisterCustomer(RegisterCustomerDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            var hashedPassword = HashPassword(dto.Password);

            var customer = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = hashedPassword,
                Phone = dto.PhoneNumber,
                PreferredEventTypes = dto.PreferredEventTypes,
                RoleId = 2 // Customer role
            };

            _context.Users.Add(customer);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Customer registered successfully." });
        }

        // ----------------- REGISTER PROVIDER -----------------
        [HttpPost("register-provider")]
        public async Task<IActionResult> RegisterProvider(RegisterProviderDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            var category = await _context.ServiceCategories
                .FirstOrDefaultAsync(c => c.ServiceCategoryId == dto.ServiceCategoryId);

            if (category == null)
                return BadRequest("Invalid Service Category.");

            var hashedPassword = HashPassword(dto.Password);

            var providerUser = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = hashedPassword,
                RoleId = 3 // Provider role
            };

            var eventProvider = new EventServiceProvider
            {
                BusinessName = dto.BusinessName,
                ServiceCategoryId = dto.ServiceCategoryId,
                Description = dto.Description,
                PricingDetails = dto.PricingDetails,
                PortfolioLink = dto.PortfolioLink,
                Location = dto.Location,
                PhoneNumber = dto.PhoneNumber,
                ProfilePictureUrl = dto.ProfilePictureUrl,
                User = providerUser
            };

            _context.Users.Add(providerUser);
            _context.EventServiceProviders.Add(eventProvider);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Provider registered successfully." });
        }

        // ----------------- LOGIN -----------------
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || HashPassword(dto.Password) != user.PasswordHash)
                return Unauthorized(new { message = "Invalid email or password." });

            if (user.IsSuspended)
                return StatusCode(403, new { message = "Your account has been suspended. Contact support." });

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                Expiration = DateTime.Now.AddHours(2),
                Role = user.Role.Name,
                FullName = user.FullName,
                Email = user.Email
            });
        }

        // ----------------- GET PROFILE (protected) -----------------
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);

            var user = await _context.Users.Include(r => r.Role)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound("User not found.");

            return Ok(new
            {
                user.FullName,
                user.Email,
                Role = user.Role.Name,
                user.Phone,
                user.PreferredEventTypes
            });
        }

        // ----------------- HELPER METHODS -----------------
        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.Name)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }
}
