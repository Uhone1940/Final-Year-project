using EventifyAPI.Models;

namespace EventifyAPI.DTOs
{
    /// <summary>
    /// DTO for updating a report.
    /// </summary>
    public class UpdateReportDto
    {
        /// <summary>
        /// Optional new title
        /// </summary>
        public string? Title { get; set; }

        /// <summary>
        /// Optional new content
        /// </summary>
        public string? Content { get; set; }

        /// <summary>
        /// Report status: Pending, Reviewed, or Resolved
        /// </summary>
        public ReportStatus? Status { get; set; }
    }
}
