using System;
using System.ComponentModel.DataAnnotations;

namespace EventifyAPI.DTOs
{
    public static class AvailabilityDto
    {
        public class CreateAvailability
        {
            [Required]
            public DateTime StartDate { get; set; }

            [Required]
            public DateTime EndDate { get; set; }
        }

        public class AvailabilityResponse
        {
            public int AvailabilityId { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
        }
    }
}
