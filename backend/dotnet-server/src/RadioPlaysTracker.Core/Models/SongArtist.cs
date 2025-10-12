namespace RadioPlaysTracker.Core.Models;

/// <summary>
/// Junction table for many-to-many relationship between Songs and Artists
/// </summary>
public class SongArtist
{
    public string SongId { get; set; } = string.Empty;
    public string ArtistId { get; set; } = string.Empty;
    public int ArtistOrder { get; set; } = 0;  // Track order of artists in credits

    // Navigation properties
    public Song Song { get; set; } = null!;
    public Artist Artist { get; set; } = null!;
}
