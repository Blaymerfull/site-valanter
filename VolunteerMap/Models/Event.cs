using System;
using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class Event
    {
        [Key]
        public int EventId { get; set; }

        [Required]
        public int CenterId { get; set; }

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

        public string? ImageUrl { get; set; } // Здесь будет храниться путь вида /uploads/file.jpg

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
