namespace VolunteerMap.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int CenterId { get; set; } // К какому центру относится чат
        public string UserEmail { get; set; } // Кто написал
        public string MessageText { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
