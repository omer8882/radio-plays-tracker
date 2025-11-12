namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// DTO for search results
/// </summary>
public class SearchResultDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<ArtistInfoDto> Artists { get; set; } = new();
    public AlbumInfoDto Album { get; set; } = new();
    public int DurationMs { get; set; }
    public int Popularity { get; set; }
    public Dictionary<string, string>? ExternalLinks { get; set; }
    public string? ImageUrl { get; set; }
}
