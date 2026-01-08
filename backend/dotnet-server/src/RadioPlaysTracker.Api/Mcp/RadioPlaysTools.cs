using ModelContextProtocol.Server;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Core.DTOs;
using System.ComponentModel;
using System.Text.Json;

namespace RadioPlaysTracker.Api.Mcp;

/// <summary>
/// MCP tools for Radio Plays Tracker - provides AI assistants access to radio play data
/// </summary>
[McpServerToolType]
public class RadioPlaysTools
{
    private readonly IPlayRepository _playRepository;
    private readonly ISongRepository _songRepository;
    private readonly IStationRepository _stationRepository;
    private readonly IArtistRepository _artistRepository;

    public RadioPlaysTools(
        IPlayRepository playRepository,
        ISongRepository songRepository,
        IStationRepository stationRepository,
        IArtistRepository artistRepository)
    {
        _playRepository = playRepository;
        _songRepository = songRepository;
        _stationRepository = stationRepository;
        _artistRepository = artistRepository;
    }

    [McpServerTool]
    [Description("Get recent plays from a specific radio station. Available stations: glglz, eco99, 100fm, galatz, 103fm, kan88")]
    public async Task<string> GetStationLastPlays(
        [Description("The name of the radio station (e.g., glglz, eco99, 100fm, galatz, 103fm, kan88)")] string station,
        [Description("Maximum number of plays to return (default: 10, max: 25)")] int limit = 10,
        [Description("Page number for pagination (default: 0)")] int page = 0)
    {
        var pageSize = Math.Min(limit, 25);
        var result = await _playRepository.GetStationPlaysAsync(station, page, pageSize);
        
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = result,
            message = $"Retrieved {result.Items.Count} plays from {station}"
        });
    }

    [McpServerTool]
    [Description("Search for songs by title or artist name. Case-insensitive fuzzy search.")]
    public async Task<string> SearchSongs(
        [Description("Search query string (searches in song title and artist name)")] string query)
    {
        var results = await _songRepository.SearchAsync(query);
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = results,
            message = $"Found {results.Count} matching songs"
        });
    }

    [McpServerTool]
    [Description("Get the most played songs within a specified time period across all stations")]
    public async Task<string> GetTopHits(
        [Description("Number of days to look back (default: 7)")] int days = 7,
        [Description("Number of top songs to return (default: 5)")] int topN = 5)
    {
        var results = await _playRepository.GetTopHitsAsync(days, topN);
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = results,
            message = $"Retrieved top {topN} hits from last {days} days"
        });
    }

    [McpServerTool]
    [Description("Get detailed information about a specific song including artists, album, and external links")]
    public async Task<string> GetSongDetails(
        [Description("The Spotify song ID")] string songId)
    {
        var details = await _songRepository.GetSongDetailsAsync(songId);
        if (details == null)
        {
            return JsonSerializer.Serialize(new
            {
                success = false,
                error = "Song not found"
            });
        }
        
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = details,
            message = $"Retrieved details for song {details.Name}"
        });
    }

    [McpServerTool]
    [Description("Search for songs played on a station around a specific timestamp. Useful for 'what was playing at X time' queries")]
    public async Task<string> SearchAroundTimestamp(
        [Description("The name of the radio station")] string station,
        [Description("The target timestamp in ISO format (e.g., 2024-01-15T14:30:00)")] string timestamp,
        [Description("The time range in minutes before and after the timestamp (default: 15)")] int rangeMinutes = 15)
    {
        if (!DateTime.TryParse(timestamp, out var parsedTimestamp))
        {
            return JsonSerializer.Serialize(new
            {
                success = false,
                error = "Invalid timestamp format. Use ISO format (e.g., 2024-01-15T14:30:00)"
            });
        }

        parsedTimestamp = DateTime.SpecifyKind(parsedTimestamp, DateTimeKind.Unspecified);
        var songs = await _playRepository.SearchAroundAsync(station, parsedTimestamp, rangeMinutes);
        
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = songs,
            message = $"Found {songs.Count} songs around {timestamp} on {station}"
        });
    }

    [McpServerTool]
    [Description("Get basic profile details for an artist including their image")]
    public async Task<string> GetArtistDetails(
        [Description("Spotify artist ID (optional if name is provided)")] string? id = null,
        [Description("Case-insensitive artist name (optional if id is provided)")] string? name = null)
    {
        if (string.IsNullOrWhiteSpace(id) && string.IsNullOrWhiteSpace(name))
        {
            return JsonSerializer.Serialize(new
            {
                success = false,
                error = "Either id or name parameter is required"
            });
        }

        var artist = !string.IsNullOrWhiteSpace(id)
            ? await _artistRepository.GetByIdAsync(id)
            : null;

        if (artist == null && !string.IsNullOrWhiteSpace(name))
        {
            artist = await _artistRepository.GetByNameAsync(name);
        }

        if (artist == null)
        {
            return JsonSerializer.Serialize(new
            {
                success = false,
                error = "Artist not found"
            });
        }

        var dto = new ArtistDetailsDto
        {
            Id = artist.Id,
            Name = artist.Name,
            ImageUrl = artist.ImageUrl
        };

        return JsonSerializer.Serialize(new
        {
            success = true,
            data = dto,
            message = $"Retrieved details for artist {artist.Name}"
        });
    }

    [McpServerTool]
    [Description("Get the top played songs for a specific artist, ranked by play count")]
    public async Task<string> GetArtistTopHits(
        [Description("The name of the artist")] string artist,
        [Description("Optional: Number of days to look back (null for all time)")] int? days = null,
        [Description("Maximum number of top songs to return (default: 10)")] int limit = 10)
    {
        var topHits = await _playRepository.GetArtistTopHitsAsync(artist, days, limit);
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = topHits,
            message = $"Retrieved top {limit} hits for {artist}"
        });
    }

    [McpServerTool]
    [Description("Get a list of all monitored radio stations")]
    public async Task<string> GetAllStations()
    {
        var stations = await _stationRepository.GetAllAsync();
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = stations,
            message = $"Retrieved {stations.Count} stations"
        });
    }

    [McpServerTool]
    [Description("Get paginated top songs with station breakdowns for a specified time period")]
    public async Task<string> GetTopSongs(
        [Description("Number of days to look back (default: 7)")] int days = 7,
        [Description("Optional station filter (default: all stations)")] string? station = null,
        [Description("Page size for results (default: 25, max: 50)")] int limit = 25,
        [Description("Zero-based page index (default: 0)")] int page = 0)
    {
        var pageSize = Math.Min(limit, 50);
        var results = await _playRepository.GetTopSongsAsync(days, station, page, pageSize);
        
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = results,
            message = $"Retrieved top songs for last {days} days"
        });
    }

    [McpServerTool]
    [Description("Get play count breakdown by station for a specific song")]
    public async Task<string> GetSongPlaysByStation(
        [Description("The Spotify song ID")] string songId,
        [Description("Optional: Number of days to look back (null for all time)")] int? days = null)
    {
        var breakdown = await _playRepository.GetSongPlaysByStationAsync(songId, days);
        return JsonSerializer.Serialize(new
        {
            success = true,
            data = breakdown,
            message = $"Retrieved play breakdown for song {songId}"
        });
    }
}
