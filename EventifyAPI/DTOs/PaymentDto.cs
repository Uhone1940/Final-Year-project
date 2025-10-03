namespace EventifyAPI.DTOs
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public int BookingId { get; set; }
    }

    public class CreatePaymentDto
    {
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public int BookingId { get; set; }
    }

    public class UpdatePaymentDto
    {
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
    }
}
