using EventifyAPI.Data;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace EventifyAPI.Middleware
{
    public class CheckUserSuspendedMiddleware
    {
        private readonly RequestDelegate _next;

        public CheckUserSuspendedMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, EventifyDbContext db)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    var user = await db.Users.AsNoTracking()
                        .FirstOrDefaultAsync(u => u.UserId == userId);

                    if (user != null && user.IsSuspended)
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsync("Your account has been suspended.");
                        return;
                    }
                }
            }

            await _next(context);
        }
    }

    public static class CheckUserSuspendedMiddlewareExtensions
    {
        public static IApplicationBuilder UseCheckUserSuspended(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CheckUserSuspendedMiddleware>();
        }
    }
}
