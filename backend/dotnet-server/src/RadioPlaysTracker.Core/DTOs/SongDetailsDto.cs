using System.Diagnostics;

namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// DTO for song details - matches Elasticsearch document structure
/// </summary>
[DebuggerDisplay("{Name} played {PlayedAt}")]
public class SongDetailsDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<ArtistInfoDto> Artists { get; set; } = new();
    public AlbumInfoDto Album { get; set; } = new();
    public int DurationMs { get; set; }
    public int Popularity { get; set; }
    public Dictionary<string, string>? ExternalLinks { get; set; }
    public DateTime? PlayedAt { get; set; }  // Optional
}

[DebuggerDisplay("{Name}")]
public class ArtistInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

[DebuggerDisplay("{Name} ({ReleaseDate})")]
public class AlbumInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<ArtistInfoDto> Artists { get; set; } = new();
    public string ReleaseDate { get; set; } = string.Empty;  // yyyy-MM-dd format
}
