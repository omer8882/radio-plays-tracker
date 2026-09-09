namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// DTO for top hits - matches Python API format
/// </summary>
public class TopHitDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;  // Comma-separated artist names
    public int Hits { get; set; }
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Play counts keyed by station name for the same period. Populated by
    /// GetTopHitsAsync so callers do not need a follow-up request per song.
    /// </summary>
    public Dictionary<string, int> StationBreakdown { get; set; } = new();
}
