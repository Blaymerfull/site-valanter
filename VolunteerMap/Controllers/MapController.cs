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
        [HttpGet("centers-by-district")]
        public async Task<IActionResult> GetByDistrictName([FromQuery] string name)
        {
            // Убираем лишние пробелы на случай, если они есть в БД или SVG
            var cleanName = name?.Trim();

            var centers = await _context.VolunteerCenters
                .Join(_context.Districts,
                      c => c.DistrictId,
                      d => d.DistrictId,
                      (c, d) => new { c, d })
                .Where(x => x.d.DistrictName == cleanName)
                .Select(x => new {
                    x.c.Name,
                    x.c.Description,
                    x.c.Address,
                    x.c.Contacts,
                    x.c.ImageUrl
                })
                .ToListAsync();

            return Ok(centers);
        }
    }
}
