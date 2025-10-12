namespace RadioPlaysTracker.Core.Models;

public class Album
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime? ReleaseDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<Song> Songs { get; set; } = new List<Song>();
    public ICollection<AlbumArtist> AlbumArtists { get; set; } = new List<AlbumArtist>();
}
