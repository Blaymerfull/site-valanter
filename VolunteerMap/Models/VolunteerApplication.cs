using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class VolunteerApplication
    {
        [Key]
        public int ApplicationId { get; set; }

        [Required]
        public int DistrictId { get; set; } // Связь с ID района

        [Required]
        public int UserId { get; set; } // ID пользователя, создавшего заявку

        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? Contacts { get; set; }
        public string? ImageUrl { get; set; }

        [Required]
        public string Status { get; set; } = "Pending"; // 'Pending', 'Approved', 'Rejected'

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
