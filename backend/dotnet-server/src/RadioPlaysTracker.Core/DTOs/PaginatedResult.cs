using System.Collections.Generic;

namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// Generic container for paginated API responses.
/// </summary>
public class PaginatedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = System.Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public bool HasMore { get; init; }
}
