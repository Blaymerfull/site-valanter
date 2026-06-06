using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;

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

        // 1. Получить все регионы для формы (GET: api/map/regions)
        [HttpGet("regions")]
        public async Task<IActionResult> GetRegions()
        {
            var regions = await _context.Regions
                .Select(r => new { regionId = r.RegionId, fullName = r.FullName })
                .ToListAsync();
            return Ok(regions);
        }

        // 2. Получить районы конкретного региона (GET: api/map/districts/{regionCode})
        [HttpGet("districts/{regionCode}")]
        public async Task<IActionResult> GetDistrictsByRegion(string regionCode)
        {
            var cleanCode = regionCode?.Trim();

            var districts = await _context.Districts
                .Where(d => d.ParentRegionId == cleanCode)
                .Select(d => new { districtId = d.DistrictId, districtName = d.DistrictName })
                .ToListAsync();

            return Ok(districts);
        }

        // 3. Метод, который вернет центры для конкретного района (ИСПРАВЛЕН РЕГИСТР БУКВ)
        [HttpGet("centers-by-district")]
        public async Task<IActionResult> GetByDistrictName([FromQuery] string name)
        {
            var cleanName = name?.Trim();

            var centers = await _context.VolunteerCenters
                .Join(_context.Districts,
                      c => c.DistrictId,
                      d => d.DistrictId,
                      (c, d) => new { c, d })
                .Where(x => x.d.DistrictName == cleanName)
                .Select(x => new {
                    centerId = x.c.CenterId,
                    regionId = x.d.ParentRegionId, // Реальный ID региона (например, 'RU-KEM')
                    name = x.c.Name,
                    description = x.c.Description,
                    address = x.c.Address,
                    contacts = x.c.Contacts,
                    imageUrl = x.c.ImageUrl,
                    districtId = x.c.DistrictId
                })
                .ToListAsync();

            return Ok(centers);
        }

        // 4. ГЛОБАЛЬНЫЙ ПОИСК С ФИЛЬТРАЦИЕЙ (ИСПРАВЛЕН REGIONID)
        [HttpGet("search")]
        public async Task<IActionResult> GlobalSearch([FromQuery] string query, [FromQuery] string filter = "all")
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());

            var cleanQuery = query.Trim().ToLower();

            var baseQuery = from c in _context.VolunteerCenters
                            join d in _context.Districts on c.DistrictId equals d.DistrictId
                            join r in _context.Regions on d.ParentRegionId equals r.RegionId
                            select new
                            {
                                Center = c,
                                District = d,
                                Region = r
                            };

            if (filter == "name")
            {
                baseQuery = baseQuery.Where(x => x.Center.Name.ToLower().Contains(cleanQuery));
            }
            else if (filter == "district")
            {
                baseQuery = baseQuery.Where(x => x.District.DistrictName.ToLower().Contains(cleanQuery));
            }
            else if (filter == "region")
            {
                baseQuery = baseQuery.Where(x => x.Region.FullName.ToLower().Contains(cleanQuery));
            }
            else
            {
                baseQuery = baseQuery.Where(x => x.Center.Name.ToLower().Contains(cleanQuery) ||
                                                 x.District.DistrictName.ToLower().Contains(cleanQuery) ||
                                                 x.Region.FullName.ToLower().Contains(cleanQuery));
            }

            var results = await baseQuery
                .Select(x => new {
                    centerId = x.Center.CenterId,
                    regionId = x.District.ParentRegionId, // ИСПРАВЛЕНО: Берем ParentRegionId из таблицы районов!
                    name = x.Center.Name,
                    description = x.Center.Description,
                    address = x.Center.Address,
                    contacts = x.Center.Contacts,
                    imageUrl = x.Center.ImageUrl,
                    districtId = x.Center.DistrictId,
                    locationInfo = x.Region.FullName + ", " + x.District.DistrictName
                })
                .Take(10)
                .ToListAsync();

            return Ok(results);
        }

        // 5. УДАЛЕНИЕ ЦЕНТРА АДМИНИСТРАТОРОМ
        [HttpDelete("delete-center/{id}")]
        public async Task<IActionResult> DeleteCenter(int id)
        {
            var center = await _context.VolunteerCenters.FindAsync(id);
            if (center == null) return NotFound(new { message = "Волонтерский центр не найден." });

            _context.VolunteerCenters.Remove(center);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Волонтерский центр успешно удален из системы!" });
        }

        // 6. ИЗМЕНЕНИЕ СУЩЕСТВУЮЩЕГО ЦЕНТРА АДМИНИСТРАТОРОМ
        [HttpPut("update-center/{id}")]
        public async Task<IActionResult> UpdateCenter(int id, [FromBody] VolunteerCenter updatedCenter)
        {
            var center = await _context.VolunteerCenters.FindAsync(id);
            if (center == null) return NotFound(new { message = "Волонтерский центр не найден." });

            center.Name = updatedCenter.Name;
            center.Description = updatedCenter.Description;
            center.Address = updatedCenter.Address;
            center.Contacts = updatedCenter.Contacts;
            center.ImageUrl = updatedCenter.ImageUrl;
            center.DistrictId = updatedCenter.DistrictId;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Данные волонтерского центра успешно обновлены!" });
        }
    }
}
