using VolunteerMap.Models;
namespace VolunteerMap.Models
{
    public class VolunteerCenter
    {
        public int CenterId { get; set; }
        public int DistrictId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string Contacts { get; set; }
        public string ImageUrl { get; set; }
    }
}
