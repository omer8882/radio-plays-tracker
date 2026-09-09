using System.Diagnostics;

namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// DTO for play records - matches Python API format
/// </summary>
[DebuggerDisplay("{Title} by {Artist}")]
public class PlayDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;  // Comma-separated artist names
    public string Time { get; set; } = string.Empty;     // Formatted time (HH:mm or dd/MM/yyyy HH:mm:ss)

    /// <summary>
    /// The play time as an unambiguous local (Israel) timestamp. Prefer this over
    /// <see cref="Time"/>, which is pre-formatted for display and cannot be parsed
    /// reliably. Kept alongside Time so existing consumers are unaffected.
    /// </summary>
    public DateTime PlayedAt { get; set; }
    public string? Station { get; set; }
    public string? Album { get; set; }
    public string? ImageUrl { get; set; }
}
