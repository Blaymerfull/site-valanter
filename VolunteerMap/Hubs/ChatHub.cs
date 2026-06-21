using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;

public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }

    // Вход в комнату чата конкретного центра
    public async Task JoinCenterChat(string centerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, centerId);
    }

    // Отправка сообщения в чат центра
    public async Task SendMessageToCenter(string centerId, string messageText)
    {
        // Получаем email из query-параметра (передаём с клиента при подключении)
        var httpContext = Context.GetHttpContext();
        var userEmail = httpContext?.Request.Query["email"].ToString() ?? "anonymous@unknown";

        // Создаем и сохраняем сообщение в БД
        var message = new ChatMessage
        {
            CenterId = int.Parse(centerId),
            UserEmail = userEmail,
            MessageText = messageText,
            SentAt = DateTime.UtcNow
        };

        _context.CenterChatMessages.Add(message);
        await _context.SaveChangesAsync();

        // Отправляем сообщение всем в группе (включая отправителя)
        await Clients.Group(centerId).SendAsync("ReceiveMessage", new
        {
            userEmail = message.UserEmail,
            messageText = message.MessageText,
            time = message.SentAt.ToLocalTime().ToString("HH:mm")
        });
    }
}