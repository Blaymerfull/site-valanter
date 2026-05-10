using System.ComponentModel.DataAnnotations;

namespace VolunteerMap.Models
{
    public class District
    {
        [Key]
        public int DistrictId { get; set; }
        public int ParentRegionId { get; set; }
        public string DistrictName { get; set; }
    }
}
