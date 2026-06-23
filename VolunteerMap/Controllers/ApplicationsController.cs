using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;
using System;
using System.IO;
using System.Threading.Tasks;

namespace VolunteerMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApplicationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ApplicationsController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env; // Используем для определения физического пути к wwwroot
        }

        // 1. ПОДАЧА ЗАЯВКИ ПОЛЬЗОВАТЕЛЕМ (POST: api/applications)
        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromForm] VolunteerApplicationForm form)
        {
            if (form == null) return BadRequest("Некорректные данные формы.");

            string? savedImagePath = null;
            if (form.ImageFile != null)
            {
                savedImagePath = await SaveFileAsync(form.ImageFile);
            }

            var app = new VolunteerApplication
            {
                DistrictId = form.DistrictId,
                UserId = form.UserId,
                Name = form.Name,
                Description = form.Description,
                Address = form.Address,
                Contacts = form.Contacts,
                ImageUrl = savedImagePath,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

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
            var apps = await (from a in _context.VolunteerApplications
                              join d in _context.Districts on a.DistrictId.ToString() equals d.DistrictId into distJoin
                              from d in distJoin.DefaultIfEmpty()
                              where a.UserId == userId
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
                                  RegionId = d != null ? d.ParentRegionId : null
                              })
                              .ToListAsync();

            return Ok(apps);
        }

        // 6. ОТМЕНА ЗАЯВКИ ПОЛЬЗОВАТЕЛЕМ (DELETE: api/applications/cancel/{id})
        [HttpDelete("cancel/{id}")]
        public async Task<IActionResult> CancelApplication(int id)
        {
            var app = await _context.VolunteerApplications.FindAsync(id);
            if (app == null) return NotFound(new { message = "Заявка не найдена." });

            if (app.Status != "Pending")
                return BadRequest(new { message = "Можно отменить только заявку на рассмотрении." });

            _context.VolunteerApplications.Remove(app);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Заявка успешно отменена." });
        }

        // 7. ОБНОВЛЕНИЕ ДАННЫХ ЗАЯВКИ АДМИНИСТРАТОРОМ (PUT: api/applications/update/{id})
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateApplication(int id, [FromForm] VolunteerApplicationForm form)
        {
            var app = await _context.VolunteerApplications.FindAsync(id);
            if (app == null) return NotFound("Заявка не найдена.");

            // Обновляем поля заявки измененными данными из формы
            app.Name = form.Name;
            app.Description = form.Description;
            app.Address = form.Address;
            app.Contacts = form.Contacts;
            app.DistrictId = form.DistrictId;

            // Если админ загрузил новое изображение с ПК — обновляем его
            if (form.ImageFile != null)
            {
                app.ImageUrl = await SaveFileAsync(form.ImageFile);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Данные заявки успешно скорректированы!" });
        }

        // Вспомогательный асинхронный метод для сохранения бинарного файла на диск ПК
        private async Task<string> SaveFileAsync(IFormFile file)
        {
            // Генерируем уникальное имя файла с помощью GUID, чтобы избежать перезаписи файлов с одинаковыми именами
            var extension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";

            // Физический путь: wwwroot/uploads/имя_файла.jpg
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Сохраняем поток данных на диск
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Возвращаем относительный путь веб-сервера для записи в БД
            return $"/uploads/{uniqueFileName}";
        }
    }

    // Вспомогательный DTO-класс (модель) для приема Multipart/Form-Data данных с фронтенда
    public class VolunteerApplicationForm
    {
        public string DistrictId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? Contacts { get; set; }
        public IFormFile? ImageFile { get; set; } // Сюда .NET Core автоматически положит бинарный файл с ПК
    }
}