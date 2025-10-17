using System.Diagnostics;

namespace RadioPlaysTracker.Core.Models;

[DebuggerDisplay("{Song} {Station}")]
public class Play
{
    public long Id { get; set; }
    public string SongId { get; set; } = string.Empty;
    public int StationId { get; set; }
    public DateTime PlayedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Song Song { get; set; } = null!;
    public Station Station { get; set; } = null!;
}
