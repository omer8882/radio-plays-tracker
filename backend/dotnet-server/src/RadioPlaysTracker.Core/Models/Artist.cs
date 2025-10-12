namespace RadioPlaysTracker.Core.Models;

public class Artist
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<SongArtist> SongArtists { get; set; } = new List<SongArtist>();
    public ICollection<AlbumArtist> AlbumArtists { get; set; } = new List<AlbumArtist>();
}
