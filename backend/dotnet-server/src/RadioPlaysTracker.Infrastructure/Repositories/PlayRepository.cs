using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.DTOs;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Core.Models;
using RadioPlaysTracker.Infrastructure.Data;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace RadioPlaysTracker.Infrastructure.Repositories;

public class PlayRepository : IPlayRepository
{
    private readonly AppDbContext _context;
    private const string TimeFormat = "HH:mm";
    private const string FullDateTimeFormat = "dd/MM/yyyy HH:mm:ss";

    // Israel timezone - handles both Windows and Linux server deployments
    private static readonly TimeZoneInfo IsraelTimeZone = GetIsraelTimeZone();
    
    // Always get current time in Israel timezone, regardless of server location
    private DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, IsraelTimeZone);

    public PlayRepository(AppDbContext context)
    {
        _context = context;
    }

    private static TimeZoneInfo GetIsraelTimeZone()
    {
        try
        {
            // Windows uses "Israel Standard Time", Linux uses "Asia/Jerusalem"
            return RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? TimeZoneInfo.FindSystemTimeZoneById("Israel Standard Time")
                : TimeZoneInfo.FindSystemTimeZoneById("Asia/Jerusalem");
        }
        catch (TimeZoneNotFoundException)
        {
            // Fallback: try the other ID
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    RuntimeInformation.IsOSPlatform(OSPlatform.Windows) 
                        ? "Asia/Jerusalem" 
                        : "Israel Standard Time");
            }
            catch
            {
                throw new InvalidOperationException(
                    "Could not find Israel timezone. Please ensure timezone data is installed on the server.");
            }
        }
    }

    public async Task<List<PlayDto>> GetLastPlaysFromStationAsync(string stationName, int limit = 10)
    {
        var plays = await _context.Plays
            .Include(p => p.Song)
                .ThenInclude(s => s.SongArtists)
                .ThenInclude(sa => sa.Artist)
            .Include(p => p.Song.Album)
            .Include(p => p.Station)
            .Where(p => EF.Functions.Like(p.Station.Name.ToLower(), stationName.ToLower()))
            .OrderByDescending(p => p.PlayedAt)
            .Take(limit)
            .ToListAsync();

        return plays.Select(p => ToPlayDto(p, TimeFormat)).ToList();
    }

    public async Task<List<PlayDto>> GetArtistPlaysAsync(string artistName, int limit = 100)
    {
        // Get all songs by this artist
        var songIds = await _context.SongArtists
            .Include(sa => sa.Artist)
            .Where(sa => EF.Functions.Like(sa.Artist.Name.ToLower(), artistName.ToLower()))
            .Select(sa => sa.SongId)
            .ToListAsync();

        if (!songIds.Any())
            return new List<PlayDto>();

        // Get plays for those songs
        var plays = await _context.Plays
            .Include(p => p.Song)
                .ThenInclude(s => s.SongArtists)
                .ThenInclude(sa => sa.Artist)
            .Include(p => p.Song.Album)
            .Include(p => p.Station)
            .Where(p => songIds.Contains(p.SongId))
            .OrderByDescending(p => p.PlayedAt)
            .Take(limit)
            .ToListAsync();

        return plays.Select(p => ToPlayDto(p, FullDateTimeFormat)).ToList();
    }

    public async Task<List<TopHitDto>> GetTopHitsAsync(int days = 7, int topN = 5)
    {
        var endDate = Now;
        var startDate = endDate.AddDays(-days);

        // Get top song IDs by play count
        var topSongs = await _context.Plays
            .Where(p => p.PlayedAt >= startDate && p.PlayedAt <= endDate)
            .GroupBy(p => p.SongId)
            .Select(g => new { SongId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(topN)
            .ToListAsync();

        if (topSongs.Count == 0)
            return [];

        // Get song details
        var songIds = topSongs.Select(x => x.SongId).ToList();
        var songs = await _context.Songs
            .Include(s => s.SongArtists.OrderBy(sa => sa.ArtistOrder))
                .ThenInclude(sa => sa.Artist)
            .Where(s => songIds.Contains(s.Id))
            .ToListAsync();

        // Combine and return
        return topSongs.Select(ts =>
        {
            var song = songs.First(s => s.Id == ts.SongId);
            return new TopHitDto
            {
                Id = song.Id,
                Title = song.Name,
                Artist = string.Join(", ", song.SongArtists.Select(sa => sa.Artist.Name)),
                Hits = ts.Count
            };
        }).ToList();
    }

    public async Task<Dictionary<string, int>> GetSongPlaysByStationAsync(string songId, int? days = null)
    {
        var query = _context.Plays
            .Include(p => p.Station)
            .Where(p => p.SongId == songId);

        if (days.HasValue)
        {
            var startDate = Now.AddDays(-days.Value);
            query = query.Where(p => p.PlayedAt >= startDate);
        }

        var plays = await query.ToListAsync();

        return plays
            .GroupBy(p => p.Station.Name)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<List<SongDetailsDto>> SearchAroundAsync(string stationName, DateTime timestamp, int rangeMinutes = 15)
    {
        var startTime = timestamp.AddMinutes(-rangeMinutes);
        var endTime = timestamp.AddMinutes(rangeMinutes);

        // First, get the station ID from the station name
        var station = await _context.Stations
            .FirstOrDefaultAsync(s => s.Name == stationName);

        if (station == null)
            return new List<SongDetailsDto>();

        var plays = await _context.Plays
            .Include(p => p.Song)
                .ThenInclude(s => s.SongArtists.OrderBy(sa => sa.ArtistOrder))
                .ThenInclude(sa => sa.Artist)
            .Include(p => p.Song.Album)
                .ThenInclude(a => a!.AlbumArtists.OrderBy(aa => aa.ArtistOrder))
                .ThenInclude(aa => aa.Artist)
            .Where(p => p.StationId == station.Id && p.PlayedAt >= startTime && p.PlayedAt <= endTime)
            .OrderBy(p => p.PlayedAt)
            .Take(100)
            .ToListAsync();

        return plays.Select(p => ToSongDetailsDto(p.Song, p.PlayedAt)).ToList();
    }

    public async Task<Play> CreateAsync(Play play)
    {
        _context.Plays.Add(play);
        await _context.SaveChangesAsync();
        return play;
    }

    public async Task<bool> PlayExistsAsync(string songId, int stationId, DateTime playedAt)
    {
        return await _context.Plays
            .AnyAsync(p => p.SongId == songId && p.StationId == stationId && p.PlayedAt == playedAt);
    }

    // Helper methods
    private static PlayDto ToPlayDto(Play play, string timeFormat)
    {
        var artistNames = string.Join(", ", play.Song.SongArtists
            .OrderBy(sa => sa.ArtistOrder)
            .Select(sa => sa.Artist.Name));

        return new PlayDto
        {
            Id = play.Song.Id,
            Title = play.Song.Name,
            Artist = artistNames,
            Time = play.PlayedAt.ToString(timeFormat),
            Station = play.Station.Name,
            Album = play.Song.Album?.Name
        };
    }

    private static SongDetailsDto ToSongDetailsDto(Song song, DateTime? playedAt = null)
    {
        var dto = new SongDetailsDto
        {
            Id = song.Id,
            Name = song.Name,
            PlayedAt = playedAt,
            DurationMs = song.DurationMs,
            Popularity = song.Popularity,
            Artists = song.SongArtists
                .OrderBy(sa => sa.ArtistOrder)
                .Select(sa => new ArtistInfoDto { Id = sa.Artist.Id, Name = sa.Artist.Name })
                .ToList(),
            Album = song.Album != null ? new AlbumInfoDto
            {
                Id = song.Album.Id,
                Name = song.Album.Name,
                ReleaseDate = song.Album.ReleaseDate?.ToString("yyyy-MM-dd") ?? "",
                Artists = song.Album.AlbumArtists
                    .OrderBy(aa => aa.ArtistOrder)
                    .Select(aa => new ArtistInfoDto { Id = aa.Artist.Id, Name = aa.Artist.Name })
                    .ToList()
            } : new AlbumInfoDto()
        };

        if (song.ExternalLinks != null)
        {
            dto.ExternalLinks = JsonSerializer.Deserialize<Dictionary<string, string>>(song.ExternalLinks);
        }

        return dto;
    }
}
