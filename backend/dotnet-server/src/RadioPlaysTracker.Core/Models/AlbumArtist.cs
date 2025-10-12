namespace RadioPlaysTracker.Core.Models;

/// <summary>
/// Junction table for many-to-many relationship between Albums and Artists
/// </summary>
public class AlbumArtist
{
    public string AlbumId { get; set; } = string.Empty;
    public string ArtistId { get; set; } = string.Empty;
    public int ArtistOrder { get; set; } = 0;

    // Navigation properties
    public Album Album { get; set; } = null!;
    public Artist Artist { get; set; } = null!;
}
