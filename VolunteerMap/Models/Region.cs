using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class Region
    {
        [Key] // Помечаем, что это первичный ключ
        public string RegionId { get; set; }
        public string FullName { get; set; }
    }
}
