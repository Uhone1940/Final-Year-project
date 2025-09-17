namespace EventifyAPI.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty; // e.g. Card, EFT
        public DateTime PaymentDate { get; set; }

        // Foreign keys
        public int BookingId { get; set; }
        public Booking Booking { get; set; }
    }
}
