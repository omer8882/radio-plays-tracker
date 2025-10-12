namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// DTO for station play breakdown
/// </summary>
public class StationBreakdownDto
{
    public Dictionary<string, int> StationCounts { get; set; } = new();
}
