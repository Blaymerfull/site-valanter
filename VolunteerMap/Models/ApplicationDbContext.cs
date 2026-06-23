using Microsoft.EntityFrameworkCore;
using VolunteerMap.Models;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<VolunteerCenter> VolunteerCenters { get; set; }
    public DbSet<Region> Regions { get; set; }
    public DbSet<District> Districts { get; set; }
    
    
    public DbSet<User> Users { get; set; }
    public DbSet<VolunteerApplication> VolunteerApplications { get; set; }


    public DbSet<Event> Events { get; set; }
    public DbSet<EventApplication> EventApplications { get; set; }

    public DbSet<ChatMessage> CenterChatMessages { get; set; }
}
