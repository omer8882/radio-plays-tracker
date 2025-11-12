namespace RadioPlaysTracker.Core.DTOs;

/// <summary>
/// Basic artist profile information exposed via the API.
/// </summary>
public class ArtistDetailsDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
