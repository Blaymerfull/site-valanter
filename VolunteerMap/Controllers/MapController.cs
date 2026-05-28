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

        
        [HttpGet("regions")]
        public async Task<IActionResult> GetRegions()
        {
            var regions = await _context.Regions
                .Select(r => new { r.RegionId, r.FullName })
                .ToListAsync();
            return Ok(regions);
        }

        // 2. Получить районы конкретного региона (GET: api/map/districts/{regionId})
        [HttpGet("districts/{regionCode}")]
        public async Task<IActionResult> GetDistrictsByRegion(string regionCode)
        {
            var cleanCode = regionCode?.Trim();

            // Прямое сравнение строк, без методов .ToString(), чтобы EF Core отработал идеально
            var districts = await _context.Districts
                .Where(d => d.ParentRegionId == cleanCode)
                .Select(d => new { d.DistrictId, d.DistrictName })
                .ToListAsync();

            return Ok(districts);
        }


    // ГЛОБАЛЬНЫЙ ПОИСК С ФИЛЬТРАЦИЕЙ (GET: api/map/search)
        [HttpGet("search")]
        public async Task<IActionResult> GlobalSearch([FromQuery] string query, [FromQuery] string filter = "all")
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());
            
            var cleanQuery = query.Trim().ToLower();

            // Формируем базовый запрос, соединяя центры, районы и области
            var baseQuery = from c in _context.VolunteerCenters
                            join d in _context.Districts on c.DistrictId equals d.DistrictId
                            join r in _context.Regions on d.ParentRegionId equals r.RegionId
                            select new
                            {
                                Center = c,
                                DistrictName = d.DistrictName,
                                RegionName = r.FullName
                            };

            // Применяем фильтрацию в зависимости от выбора пользователя
            if (filter == "name") {
                baseQuery = baseQuery.Where(x => x.Center.Name.ToLower().Contains(cleanQuery));
            }
            else if (filter == "district") {
                baseQuery = baseQuery.Where(x => x.DistrictName.ToLower().Contains(cleanQuery));
            }
            else if (filter == "region") {
                baseQuery = baseQuery.Where(x => x.RegionName.ToLower().Contains(cleanQuery));
            }
            else { // "all" — ищем совпадение везде
                baseQuery = baseQuery.Where(x => x.Center.Name.ToLower().Contains(cleanQuery) || 
                                                x.DistrictName.ToLower().Contains(cleanQuery) || 
                                                x.RegionName.ToLower().Contains(cleanQuery));
            }

            // Приводим к конечному результату и ограничиваем выборку 10 записями ради скорости
            var results = await baseQuery
                .Select(x => new {
                    name = x.Center.Name,
                    description = x.Center.Description,
                    address = x.Center.Address,
                    contacts = x.Center.Contacts,
                    imageUrl = x.Center.ImageUrl,
                    locationInfo = x.RegionName + ", " + x.DistrictName
                })
                .Take(10)
                .ToListAsync();

            return Ok(results);
        }

    }
}
