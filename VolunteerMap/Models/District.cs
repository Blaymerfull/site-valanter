using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class District
    {
        [Key]
        public string DistrictId { get; set; }
        public string ParentRegionId { get; set; }
        public string DistrictName { get; set; }
    }
}
