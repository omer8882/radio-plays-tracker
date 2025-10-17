using System.Diagnostics;

namespace RadioPlaysTracker.Core.Models;

[DebuggerDisplay("{Name}")]
public class Station
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<Play> Plays { get; set; } = new List<Play>();
}
