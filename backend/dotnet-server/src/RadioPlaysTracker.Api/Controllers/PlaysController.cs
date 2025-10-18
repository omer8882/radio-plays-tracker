using Microsoft.AspNetCore.Mvc;
using RadioPlaysTracker.Core.Interfaces;

namespace RadioPlaysTracker.Api.Controllers;

/// <summary>
/// API endpoints for managing and querying radio play data
/// </summary>
[ApiController]
[Route("api")]
public class PlaysController : ControllerBase
{
    private readonly IPlayRepository _playRepository;
    private readonly ISongRepository _songRepository;

    public PlaysController(IPlayRepository playRepository, ISongRepository songRepository)
    {
        _playRepository = playRepository;
        _songRepository = songRepository;
    }

    /// <summary>
    /// Get the most recent plays from a specific radio station
    /// </summary>
    /// <param name="station">The name of the radio station</param>
    /// <param name="limit">Maximum number of plays to return (default: 10)</param>
    /// <returns>A list of recent plays from the specified station</returns>
    /// <response code="200">Returns the list of recent plays</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("station_last_plays")]
    [ProducesResponseType(typeof(IEnumerable<Core.DTOs.PlayDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [EndpointSummary("Stations = ['glglz', 'eco99', '100fm', 'galatz', '103fm', 'kan88']")]
    public async Task<IActionResult> GetStationLastPlays([FromQuery] string station, [FromQuery] int limit = 10)
    {
        try
        {
            var plays = await _playRepository.GetLastPlaysFromStationAsync(station, limit);
            return Ok(plays);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get all plays for a specific artist
    /// </summary>
    /// <param name="artist">The name of the artist</param>
    /// <param name="limit">Maximum number of plays to return (default: 100)</param>
    /// <returns>A list of plays featuring the specified artist</returns>
    /// <response code="200">Returns the list of artist plays</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("get_artist_plays")]
    [ProducesResponseType(typeof(IEnumerable<Core.DTOs.PlayDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetArtistPlays([FromQuery] string artist, [FromQuery] int limit = 100)
    {
        try
        {
            var plays = await _playRepository.GetArtistPlaysAsync(artist, limit);
            return Ok(plays);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get the top played songs for a specific artist, ranked by play count
    /// </summary>
    /// <param name="artist">The name of the artist</param>
    /// <param name="days">Optional: Number of days to look back (null for all time)</param>
    /// <param name="limit">Maximum number of top songs to return (default: 10)</param>
    /// <returns>A list of the artist's most played songs ordered by hit count</returns>
    /// <response code="200">Returns the list of artist's top hits</response>
    /// <response code="500">If there was an internal server error</response>
    /// <remarks>
    /// This endpoint returns songs by the specified artist ordered by their play count.
    /// Use the days parameter to limit results to a specific time period, or omit it to get all-time statistics.
    /// 
    /// Example requests:
    /// 
    ///     GET /api/artist_top_hits?artist=Radiohead&amp;limit=20
    ///     GET /api/artist_top_hits?artist=Radiohead&amp;days=30&amp;limit=10
    /// 
    /// </remarks>
    [HttpGet("artist_top_hits")]
    [ProducesResponseType(typeof(IEnumerable<Core.DTOs.TopHitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetArtistTopHits(
        [FromQuery] string artist, 
        [FromQuery] int? days = null, 
        [FromQuery] int limit = 10)
    {
        try
        {
            var topHits = await _playRepository.GetArtistTopHitsAsync(artist, days, limit);
            return Ok(topHits);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get the top played songs within a specified time period
    /// </summary>
    /// <param name="days">Number of days to look back (default: 7)</param>
    /// <param name="top_n">Number of top songs to return (default: 5)</param>
    /// <returns>A list of the most played songs</returns>
    /// <response code="200">Returns the list of top hits</response>
    /// <response code="500">If there was an internal server error</response>
    /// <remarks>
    /// Example request:
    /// 
    ///     GET /api/top_hits?days=7&amp;top_n=10
    /// 
    /// </remarks>
    [HttpGet("top_hits")]
    [ProducesResponseType(typeof(IEnumerable<Core.DTOs.TopHitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTopHits([FromQuery] int days = 7, [FromQuery] int top_n = 5)
    {
        try
        {
            var topHits = await _playRepository.GetTopHitsAsync(days, top_n);
            return Ok(topHits);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get play count breakdown by station for a specific song
    /// </summary>
    /// <param name="song_id">The unique identifier of the song</param>
    /// <param name="days">Optional: Number of days to look back (null for all time)</param>
    /// <returns>A dictionary with station names as keys and play counts as values</returns>
    /// <response code="200">Returns the play count breakdown by station</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("song_plays_by_station")]
    [ProducesResponseType(typeof(Dictionary<string, int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSongPlaysByStation([FromQuery] string song_id, [FromQuery] int? days = null)
    {
        try
        {
            var breakdown = await _playRepository.GetSongPlaysByStationAsync(song_id, days);
            return Ok(breakdown);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Search for songs played on a station around a specific timestamp
    /// </summary>
    /// <param name="station">The name of the radio station</param>
    /// <param name="timestamp">The target timestamp in ISO format (e.g., 2024-01-15T14:30:00)</param>
    /// <param name="range_minutes">The time range in minutes before and after the timestamp (default: 15)</param>
    /// <returns>A list of songs played within the specified time range</returns>
    /// <response code="200">Returns the list of songs played around the timestamp</response>
    /// <response code="400">If the timestamp format is invalid</response>
    /// <response code="500">If there was an internal server error</response>
    /// <remarks>
    /// Useful for identifying a song you heard at a specific time.
    /// The timestamp should be in Israel timezone (database timezone).
    /// 
    /// Example request:
    /// 
    ///     GET /api/search_around?station=GalgalatzFM&amp;timestamp=2024-01-15T14:30:00&amp;range_minutes=15
    /// 
    /// </remarks>
    [HttpGet("search_around")]
    [ProducesResponseType(typeof(IEnumerable<Core.DTOs.SongDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SearchAround(
        [FromQuery] string station,
        [FromQuery] string timestamp,
        [FromQuery] int range_minutes = 15)
    {
        try
        {
            if (!DateTime.TryParse(timestamp, out var parsedTimestamp))
            {
                return BadRequest(new { detail = "Invalid timestamp format. Please use ISO format." });
            }
            
            // Database stores timestamp without timezone (Israel time).
            // Use Unspecified to match directly with database values.
            parsedTimestamp = DateTime.SpecifyKind(parsedTimestamp, DateTimeKind.Unspecified);

            var songs = await _playRepository.SearchAroundAsync(station, parsedTimestamp, range_minutes);
            return Ok(songs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Search for songs by title or artist name
    /// </summary>
    /// <param name="query">Search query string (searches in song title and artist name)</param>
    /// <returns>A list of songs matching the search query</returns>
    /// <response code="200">Returns the list of matching songs</response>
    /// <response code="500">If there was an internal server error</response>
    /// <remarks>
    /// The search is case-insensitive and searches across song titles and artist names.
    /// </remarks>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<Core.DTOs.SearchResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        try
        {
            var results = await _songRepository.SearchAsync(query);
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get detailed information about a specific song
    /// </summary>
    /// <param name="song_id">The unique identifier of the song</param>
    /// <returns>Detailed information about the song including artists, album, and external links</returns>
    /// <response code="200">Returns the song details</response>
    /// <response code="404">If the song was not found</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("get_song_details")]
    [ProducesResponseType(typeof(Core.DTOs.SongDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSongDetails([FromQuery] string song_id)
    {
        try
        {
            var songDetails = await _songRepository.GetSongDetailsAsync(song_id);
            if (songDetails == null)
            {
                return NotFound(new { detail = "Song not found" });
            }
            return Ok(songDetails);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { detail = $"Server Error: {ex.Message}" });
        }
    }
}
