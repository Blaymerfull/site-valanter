using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace VolunteerMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public EventsController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env; // Используем для определения физического пути к wwwroot
        }

        // 1. ПОЛУЧИТЬ МЕРОПРИЯТИЯ ДЛЯ КАРТОЧКИ ЦЕНТРА (GET: api/events/center/{centerId})
        [HttpGet("center/{centerId}")]
        public async Task<IActionResult> GetEventsByCenter(int centerId)
        {
            var now = DateTime.Now;

            // Извлекаем все одобренные мероприятия центра
            var allEvents = await _context.Events
                .Where(e => e.CenterId == centerId)
                .OrderBy(e => e.StartDate)
                .ToListAsync();

            // Автоматически разделяем на текущие (активные) и прошедшие на основе системного времени
            var currentEvents = allEvents.Where(e => e.EndDate >= now).ToList();
            var pastEvents = allEvents.Where(e => e.EndDate < now).ToList();

            return Ok(new
            {
                current = currentEvents,
                past = pastEvents
            });
        }

        // 2. ПОДАЧА ЗАЯВКИ НА МЕРОПРИЯТИЕ ПОЛЬЗОВАТЕЛЕМ (POST: api/events/apply)
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyEvent([FromForm] EventApplicationForm form)
        {
            if (form == null) return BadRequest("Некорректные данные формы.");

            string? savedImagePath = null;
            if (form.ImageFile != null)
            {
                savedImagePath = await SaveFileAsync(form.ImageFile);
            }

            var app = new EventApplication
            {
                CenterId = form.CenterId,
                UserId = form.UserId,
                Title = form.Title,
                Description = form.Description,
                StartDate = form.StartDate,
                EndDate = form.EndDate,
                Location = form.Location,
                CoordinatorContacts = form.CoordinatorContacts,
                ImageUrl = savedImagePath,
                Status = "Pending"
            };

            _context.EventApplications.Add(app);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Заявка на мероприятие успешно отправлена на модерацию!" });
        }

        // 3. ПОЛУЧЕНИЕ ЗАЯВОК НА МЕРОПРИЯТИЯ ДЛЯ АДМИНА (GET: api/events/pending)
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingEvents()
        {
            var apps = await _context.EventApplications
                .Where(a => a.Status == "Pending")
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(apps);
        }

        // 4. ОДОБРЕНИЕ МЕРОПРИЯТИЯ АДМИНИСТРАТОРОМ (POST: api/events/approve/{id})
        [HttpPost("approve/{id}")]
        public async Task<IActionResult> ApproveEvent(int id)
        {
            var app = await _context.EventApplications.FindAsync(id);
            if (app == null) return NotFound("Заявка на мероприятие не найдена.");

            app.Status = "Approved";

            // Копируем данные в основную таблицу мероприятий
            var newEvent = new Event
            {
                CenterId = app.CenterId,
                Title = app.Title,
                Description = app.Description,
                StartDate = app.StartDate,
                EndDate = app.EndDate,
                Location = app.Location,
                CoordinatorContacts = app.CoordinatorContacts,
                ImageUrl = app.ImageUrl
            };

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Мероприятие успешно одобрено и добавлено в карточку центра!" });
        }

        // 5. ОТКЛОНЕНИЕ МЕРОПРИЯТИЯ АДМИНИСТРАТОРОМ (POST: api/events/reject/{id})
        [HttpPost("reject/{id}")]
        public async Task<IActionResult> RejectEvent(int id)
        {
            var app = await _context.EventApplications.FindAsync(id);
            if (app == null) return NotFound("Заявка на мероприятие не найдена.");

            app.Status = "Rejected";
            _context.EventApplications.Remove(app);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Заявка на мероприятие отклонена и удалена." });
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
    public class EventApplicationForm
    {
        public int CenterId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Location { get; set; }
        public string? CoordinatorContacts { get; set; }
        public IFormFile? ImageFile { get; set; } // Сюда .NET Core автоматически положит бинарный файл с ПК
    }
}
