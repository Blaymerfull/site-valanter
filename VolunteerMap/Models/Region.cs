using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class Region
    {
        [Key] // Помечаем, что это первичный ключ
        public int RegionId { get; set; }
        public string FullName { get; set; }
    }
}
