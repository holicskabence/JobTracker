namespace JobTracker.Domain.Entities;

public class CalendarEvent
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}
