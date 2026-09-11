using System;

namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// One station with its lifetime figures.
///
/// Station identity previously existed only in the frontend's constants file,
/// which meant the sitemap had to hardcode its own copy of the list. This makes
/// the database the single source for who the stations are.
/// </summary>
public class StationSummaryDto
{
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public int TotalPlays { get; set; }
    public int UniqueSongs { get; set; }
    public DateTime? FirstPlayedAt { get; set; }
    public DateTime? LastPlayedAt { get; set; }
}
