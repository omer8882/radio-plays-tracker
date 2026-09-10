using System;
using System.Collections.Generic;

namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// A page of a single song's play history, plus the lifetime figures that make
/// the page worth reading. Existing endpoints expose only play *counts*; this is
/// the first that answers "when".
/// </summary>
public class SongPlayHistoryDto
{
    public IReadOnlyList<PlayDto> Items { get; init; } = Array.Empty<PlayDto>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public bool HasMore { get; init; }

    /// <summary>Total plays across all stations, all time — not just this page.</summary>
    public int TotalPlays { get; init; }

    public DateTime? FirstPlayedAt { get; init; }
    public DateTime? LastPlayedAt { get; init; }
}
