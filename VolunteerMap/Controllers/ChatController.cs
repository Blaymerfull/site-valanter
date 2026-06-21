using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context; // Замените на ваше имя контекста БД

    public ChatController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/chat/history/{centerId}
    [HttpGet("history/{centerId}")]
    public async Task<IActionResult> GetChatHistory(int centerId)
    {
        // Достаем сообщения для конкретного центра, сортируем по дате
        var messages = await _context.CenterChatMessages
            .Where(m => m.CenterId == centerId)
            .OrderBy(m => m.SentAt)
            .Take(50) // Ограничим до 50 последних сообщений, чтобы не перегружать сеть
            .Select(m => new
            {
                userEmail = m.UserEmail,
                messageText = m.MessageText,
                // Форматируем дату в удобный вид (Часы:Минуты)
                time = m.SentAt.ToLocalTime().ToString("HH:mm")
            })
            .ToListAsync();

        return Ok(messages);
    }
}