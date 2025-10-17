using System.Diagnostics;
using System.Text.Json;

namespace RadioPlaysTracker.Core.Models;

[DebuggerDisplay("{Name}")]
public class Song
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AlbumId { get; set; }
    public int DurationMs { get; set; }
    public int Popularity { get; set; }
    public JsonDocument? ExternalLinks { get; set; }  // Stores JSON: {spotify, youtube, apple_music}
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Album? Album { get; set; }
    public ICollection<SongArtist> SongArtists { get; set; } = new List<SongArtist>();
    public ICollection<Play> Plays { get; set; } = new List<Play>();
}
