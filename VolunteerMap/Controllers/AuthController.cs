using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;
using System.Security.Cryptography;
using System.Text;

namespace VolunteerMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. МАРШРУТ ДЛЯ РЕГИСТРАЦИИ (POST: api/auth/register)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthModel model)
        {
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return BadRequest(new { message = "Пользователь с таким Email уже зарегистрирован" });
            }

            // Хешируем пароль методом SHA256 (не храним в чистом виде)
            string passwordHash = HashPassword(model.Password);

            var newUser = new User
            {
                Email = model.Email,
                PasswordHash = passwordHash,
                Role = "User" // По умолчанию все обычные пользователи
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Регистрация успешно завершена" });
        }

        // 2. МАРШРУТ ДЛЯ ВХОДА (POST: api/auth/login)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthModel model)
        {
            string passwordHash = HashPassword(model.Password);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == model.Email && u.PasswordHash == passwordHash);

            if (user == null)
            {
                return Unauthorized(new { message = "Неверный Email или пароль" });
            }

            // Возвращаем фронтенду данные об успешном входе и роли пользователя
            return Ok(new
            {
                email = user.Email,
                role = user.Role,
                userId = user.UserId,
                message = "Вход успешно выполнен"
            });
        }

        // Вспомогательный метод для хэширования паролей
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var builder = new StringBuilder();
                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }

    // Класс-модель для приема данных от фронтенда
    public class AuthModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}