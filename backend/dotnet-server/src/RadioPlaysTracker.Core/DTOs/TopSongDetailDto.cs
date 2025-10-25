using System;
using System.Collections.Generic;

namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// Summary data for a top song over a time period.
/// </summary>
public class TopSongDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public int Plays { get; set; }
    public string? Album { get; set; }
    public DateTime? LastPlayedAt { get; set; }
    public Dictionary<string, int> StationBreakdown { get; set; } = new();
}
