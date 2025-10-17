using Microsoft.AspNetCore.Mvc;
using RadioPlaysTracker.Core.Interfaces;

namespace RadioPlaysTracker.Api.Controllers;

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

    [HttpGet("station_last_plays")]
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

    [HttpGet("get_artist_plays")]
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

    [HttpGet("top_hits")]
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

    [HttpGet("song_plays_by_station")]
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

    [HttpGet("search_around")]
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

    [HttpGet("search")]
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

    [HttpGet("get_song_details")]
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
