using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace VolunteerMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MapController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MapController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Метод, который вернет центры для конкретного региона
        [HttpGet("centers/{regionId}")]
        public async Task<IActionResult> GetCenters(int regionId)
        {
            // Сначала получаем список ID районов, принадлежащих региону
            var districtIds = await _context.Districts
                .Where(d => d.ParentRegionId == regionId)
                .Select(d => d.DistrictId)
                .ToListAsync();

            if (!districtIds.Any())
            {
                return NotFound("Районы для этого региона не найдены.");
            }

            // Теперь получаем центры, которые входят в эти районы
            var centers = await _context.VolunteerCenters
                .Where(c => districtIds.Contains(c.DistrictId))
                .Select(c => new {
                    c.Name,
                    c.Description,
                    c.Address,
                    c.Contacts,
                    c.ImageUrl
                })
                .ToListAsync();

            return Ok(centers);
        }
    }
}
