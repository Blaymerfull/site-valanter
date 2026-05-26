using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        [Required]
        public string Role { get; set; } = "User"; // По умолчанию обычный пользователь. Может быть "Admin"
    }
}
