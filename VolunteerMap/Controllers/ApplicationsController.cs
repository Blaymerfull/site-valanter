using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;

namespace VolunteerMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ApplicationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. ПОДАЧА ЗАЯВКИ ПОЛЬЗОВАТЕЛЕМ (POST: api/applications)
        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] VolunteerApplication app)
        {
            if (app == null) return BadRequest("Некорректные данные формы.");

            app.Status = "Pending"; // Принудительно ставим статус ожидания
            app.CreatedAt = DateTime.Now;

            _context.VolunteerApplications.Add(app);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Заявка успешно отправлена на модерацию администратору!" });
        }

        // 2. ПОЛУЧЕНИЕ ВСЕХ ЗАЯВОК ДЛЯ АДМИНА (GET: api/applications/pending)
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingApplications()
        {
            // Соединяем таблицу заявок с таблицей районов, чтобы узнать RegionId (ParentRegionId)
            var apps = await (from a in _context.VolunteerApplications
                              join d in _context.Districts on a.DistrictId.ToString() equals d.DistrictId
                              where a.Status == "Pending"
                              orderby a.CreatedAt descending
                              select new
                              {
                                  a.ApplicationId,
                                  a.DistrictId,
                                  a.UserId,
                                  a.Name,
                                  a.Description,
                                  a.Address,
                                  a.Contacts,
                                  a.ImageUrl,
                                  a.Status,
                                  a.CreatedAt,
                                  RegionId = d.ParentRegionId // Добавляем ID региона в ответ сервера
                              })
                              .ToListAsync();

            return Ok(apps);
        }

        // 3. ОДОБРЕНИЕ ЗАЯВКИ АДМИНИСТРАТОРОМ (POST: api/applications/approve/{id})
        [HttpPost("approve/{id}")]
        public async Task<IActionResult> ApproveApplication(int id)
        {
            var app = await _context.VolunteerApplications.FindAsync(id);
            if (app == null) return NotFound("Заявка не найдена.");

            app.Status = "Approved";

            // Переносим одобренные данные в основную таблицу волонтерских центров
            var newCenter = new VolunteerCenter
            {
                DistrictId = app.DistrictId.ToString(), // Синхронизируем строковый ID
                Name = app.Name,
                Description = app.Description,
                Address = app.Address,
                Contacts = app.Contacts,
                ImageUrl = app.ImageUrl
            };

            _context.VolunteerCenters.Add(newCenter);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Заявка одобрена. Центр успешно добавлен на карту!" });
        }

        // 4. ОТКЛОНЕНИЕ ЗАЯВКИ АДМИНИСТРАТОРОМ (POST: api/applications/reject/{id})
        [HttpPost("reject/{id}")]
        public async Task<IActionResult> RejectApplication(int id)
        {
            var app = await _context.VolunteerApplications.FindAsync(id);
            if (app == null) return NotFound("Заявка не найдена.");

            app.Status = "Rejected";

            // Если нужно физически удалить строчку из БД:
            //_context.VolunteerApplications.Remove(app);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Заявка отклонена и удалена из списка." });
        }
        // 5. ПОЛУЧЕНИЕ ЗАЯВОК ПОЛЬЗОВАТЕЛЯ НА ЦЕНТРЫ (GET: api/applications/user/{userId})
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserApplications(int userId)
        {
            var apps = await _context.VolunteerApplications
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(apps);
        }

        // 6. ОБНОВЛЕНИЕ ДАННЫХ ЗАЯВКИ АДМИНИСТРАТОРОМ (PUT: api/applications/update/{id})
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateApplication(int id, [FromBody] VolunteerApplication updatedApp)
        {
            var app = await _context.VolunteerApplications.FindAsync(id);
            if (app == null) return NotFound("Заявка не найдена.");

            // Обновляем поля заявки измененными данными из формы
            app.Name = updatedApp.Name;
            app.Description = updatedApp.Description;
            app.Address = updatedApp.Address;
            app.Contacts = updatedApp.Contacts;
            app.ImageUrl = updatedApp.ImageUrl;
            app.DistrictId = updatedApp.DistrictId; // Район тоже можно перезаписать

            await _context.SaveChangesAsync();

            return Ok(new { message = "Данные заявки успешно скорректированы!" });
        }
    }
}
