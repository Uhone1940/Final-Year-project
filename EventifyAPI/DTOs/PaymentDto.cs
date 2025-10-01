using System;
using System.ComponentModel.DataAnnotations;

namespace EventifyAPI.DTOs
{
    public static class PaymentDto
    {
        public class CreatePayment
        {
            [Required]
            public int BookingId { get; set; }

            [Required]
            [Range(0.01, double.MaxValue)]
            public decimal Amount { get; set; }

            [Required]
            [StringLength(10)]
            public string Currency { get; set; } = "ZAR";

            // optional: provider transaction id
            public string? ProviderTransactionId { get; set; }
        }

        public class PaymentResponse
        {
            public int PaymentId { get; set; }
            public int BookingId { get; set; }
            public decimal Amount { get; set; }
            public string Currency { get; set; } = string.Empty;
            public DateTime PaidAt { get; set; }
            public string? ProviderTransactionId { get; set; }
        }
    }
}
