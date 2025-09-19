using EventifyAPI.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace EventifyAPI.DTOs
{
    /// <summary>
    /// DTO for creating a new event
    /// </summary>
    public class CreateEventDto
    {
        /// <summary>
        /// Name of the event
        /// </summary>
        [Required]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Event date
        /// </summary>
        [Required]
        public DateTime Date { get; set; }

        /// <summary>
        /// Event location
        /// </summary>
        [Required]
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Event description
        /// </summary>
        public string? Description { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing event
    /// </summary>
    public class UpdateEventDto
    {
        /// <summary>
        /// Updated name of the event
        /// </summary>
        public string? Name { get; set; }

        /// <summary>
        /// Updated event date
        /// </summary>
        public DateTime? Date { get; set; }

        /// <summary>
        /// Updated location
        /// </summary>
        public string? Location { get; set; }

        /// <summary>
        /// Updated description
        /// </summary>
        public string? Description { get; set; }
    }

    /// <summary>
    /// DTO for returning event info in responses
    /// </summary>
    public class EventResponseDto
    {
        /// <summary>
        /// Event identifier
        /// </summary>
        public int EventId { get; set; }

        /// <summary>
        /// Event name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Event date
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Event location
        /// </summary>
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Event description
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Id of the user who created the event
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Full name of the user who created the event
        /// </summary>
        public string UserFullName { get; set; } = string.Empty;

        /// <summary>
        /// Number of bookings associated with this event
        /// </summary>
        public int BookingCount { get; set; }
    }
}
