using Microsoft.EntityFrameworkCore;
using EventifyAPI.Models;
using System.Security.Cryptography;
using System.Text;

namespace EventifyAPI.Data
{
    public class EventifyDbContext : DbContext
    {
        public EventifyDbContext(DbContextOptions<EventifyDbContext> options) : base(options)
        {
        }

        // DbSets for all tables
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventServiceProvider> EventServiceProviders { get; set; }
        public DbSet<ServiceCategory> ServiceCategories { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Availability> Availabilities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // -------------------------
            // COLUMN CONFIGURATIONS
            // -------------------------

            // Fix Payment Amount decimal precision
            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");

            // Set CreatedAt default value for User
            modelBuilder.Entity<User>()
                .Property(u => u.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // -------------------------
            // RELATIONSHIPS
            // -------------------------

            // User -> Role (many-to-one)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event -> User (Organizer)
            modelBuilder.Entity<Event>()
                .HasOne(e => e.User)
                .WithMany(u => u.Events)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking -> Event
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Event)
                .WithMany(e => e.Bookings)
                .HasForeignKey(b => b.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking -> User (Customer)
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking -> EventServiceProvider
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.EventServiceProvider)
                .WithMany(sp => sp.Bookings)
                .HasForeignKey(b => b.EventServiceProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Payment -> Booking
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Booking)
                .WithMany(b => b.Payments)
                .HasForeignKey(p => p.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Review -> User
            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Review -> EventServiceProvider
            modelBuilder.Entity<Review>()
                .HasOne(r => r.EventServiceProvider)
                .WithMany(sp => sp.Reviews)
                .HasForeignKey(r => r.EventServiceProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Availability -> EventServiceProvider
            modelBuilder.Entity<Availability>()
                .HasOne(a => a.EventServiceProvider)
                .WithMany(sp => sp.Availabilities)
                .HasForeignKey(a => a.EventServiceProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification -> User
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // EventServiceProvider -> ServiceCategory (many-to-one)
            modelBuilder.Entity<EventServiceProvider>()
                .HasOne(sp => sp.ServiceCategory)
                .WithMany(c => c.EventServiceProviders)
                .HasForeignKey(sp => sp.ServiceCategoryId)
                .IsRequired()              // FK cannot be null
                .OnDelete(DeleteBehavior.Restrict);  // avoids cascade issues

            // Report ? Reporter (required)
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Reporter)
                .WithMany() // we’re not tracking all reports submitted by a user right now
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict); // prevent deleting user from wiping reports

            // Report ? ReportedUser (optional)
            modelBuilder.Entity<Report>()
                .HasOne(r => r.ReportedUser)
                .WithMany() // could also make .WithMany(u => u.ReportsAgainst) if you want navigation
                .HasForeignKey(r => r.ReportedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Report ? Event (optional)
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Event)
                .WithMany() // or .WithMany(e => e.Reports) if you want
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            // Report ? Booking (optional)
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Booking)
                .WithMany() // or .WithMany(b => b.Reports)
                .HasForeignKey(r => r.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Event ? ServiceCategory (many-to-many)
            modelBuilder.Entity<EventServiceCategory>()
                .HasKey(es => new { es.EventId, es.ServiceCategoryId });

            modelBuilder.Entity<EventServiceCategory>()
               .HasOne(es => es.Event)
               .WithMany(e => e.ServicesNeeded)
               .HasForeignKey(es => es.EventId)
               .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<EventServiceCategory>()
                .HasOne(es => es.ServiceCategory)
                .WithMany()
                .HasForeignKey(es => es.ServiceCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // SEED DATA
            // -------------------------

            // Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { RoleId = 1, Name = "Admin" },
                new Role { RoleId = 2, Name = "Customer" },
                new Role { RoleId = 3, Name = "EventServiceProvider" }
            );

            // Admin
            var adminPassword = HashPassword("Admin@123");

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    FullName = "System Admin",
                    Email = "admin@eventify.com",
                    PasswordHash = adminPassword,
                    Phone = "0000000000",
                    RoleId = 1,
                    IsSuspended = false,
                    CreatedAt = new DateTime(2025, 10, 29, 0, 0, 0, DateTimeKind.Utc)
                    // CreatedAt 
                }
            );

            // Service Categories

            modelBuilder.Entity<ServiceCategory>().HasData(
                new ServiceCategory { ServiceCategoryId = 1, Name = "Catering" },
                new ServiceCategory { ServiceCategoryId = 2, Name = "Photography / Videography" },
                new ServiceCategory { ServiceCategoryId = 3, Name = "Music / DJ" },
                new ServiceCategory { ServiceCategoryId = 4, Name = "Venue Decoration" },
                new ServiceCategory { ServiceCategoryId = 5, Name = "Security" },
                new ServiceCategory { ServiceCategoryId = 6, Name = "Event Planning" }
            );

            // Automatically exclude soft-deleted service categories from all queries:
            modelBuilder.Entity<ServiceCategory>().HasQueryFilter(c => !c.IsDeleted);

            modelBuilder.Entity<EventServiceProvider>().HasQueryFilter(sp => !sp.IsDeleted && !sp.ServiceCategory.IsDeleted);
        }

        // -------------------------
        // HELPER METHOD
        // -------------------------
        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }
    }
}
