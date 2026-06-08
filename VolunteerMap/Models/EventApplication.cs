using System;
using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class EventApplication
    {
        [Key]
        public int EventApplicationId { get; set; }

        [Required]
        public int CenterId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [StringLength(300)]
        public string? Location { get; set; }

        [StringLength(200)]
        public string? CoordinatorContacts { get; set; }

        public string? ImageUrl { get; set; }

        [Required]
        public string Status { get; set; } = "Pending"; // 'Pending', 'Approved', 'Rejected'

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
