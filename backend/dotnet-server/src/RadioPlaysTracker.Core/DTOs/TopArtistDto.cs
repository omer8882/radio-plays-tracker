namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// Aggregated metrics for a top artist.
/// </summary>
public class TopArtistDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Plays { get; set; }
    public int UniqueSongs { get; set; }
    public string? TopStation { get; set; }
    public int? TopStationPlays { get; set; }
}
