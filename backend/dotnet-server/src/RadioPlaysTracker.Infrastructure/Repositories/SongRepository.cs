using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.DTOs;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Core.Models;
using RadioPlaysTracker.Infrastructure.Data;
using System.Text.Json;

namespace RadioPlaysTracker.Infrastructure.Repositories;

public class SongRepository : ISongRepository
{
    private readonly AppDbContext _context;

    public SongRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Song?> GetByIdAsync(string id)
    {
        return await _context.Songs
            .Include(s => s.SongArtists)
                .ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
                .ThenInclude(a => a!.AlbumArtists)
                .ThenInclude(aa => aa.Artist)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<SongDetailsDto?> GetSongDetailsAsync(string id)
    {
        var song = await GetByIdAsync(id);
        if (song == null)
            return null;

        var dto = new SongDetailsDto
        {
            Id = song.Id,
            Name = song.Name,
            DurationMs = song.DurationMs,
            Popularity = song.Popularity,
               ImageUrl = song.ImageUrl,
            Artists = song.SongArtists
                .OrderBy(sa => sa.ArtistOrder)
                   .Select(sa => new ArtistInfoDto
                   {
                       Id = sa.Artist.Id,
                       Name = sa.Artist.Name,
                       ImageUrl = sa.Artist.ImageUrl
                   })
                .ToList(),
            Album = song.Album != null ? new AlbumInfoDto
            {
                Id = song.Album.Id,
                Name = song.Album.Name,
                ReleaseDate = song.Album.ReleaseDate?.ToString("yyyy-MM-dd") ?? "",
                   ImageUrl = song.Album.ImageUrl,
                Artists = song.Album.AlbumArtists
                    .OrderBy(aa => aa.ArtistOrder)
                       .Select(aa => new ArtistInfoDto
                       {
                           Id = aa.Artist.Id,
                           Name = aa.Artist.Name,
                           ImageUrl = aa.Artist.ImageUrl
                       })
                    .ToList()
            } : new AlbumInfoDto()
        };

        if (song.ExternalLinks != null)
        {
            dto.ExternalLinks = JsonSerializer.Deserialize<Dictionary<string, string>>(song.ExternalLinks);
        }

        return dto;
    }

    public async Task<List<SearchResultDto>> SearchAsync(string query)
    {
        // Using PostgreSQL pg_trgm extension for fuzzy text search
        // EF.Functions.TrigramsAreSimilar is available with Npgsql.EntityFrameworkCore.PostgreSQL
        
        // Search in song names and artist names
        var songs = await _context.Songs
            .Include(s => s.SongArtists.OrderBy(sa => sa.ArtistOrder))
                .ThenInclude(sa => sa.Artist)
            .Include(s => s.Album)
                .ThenInclude(a => a!.AlbumArtists.OrderBy(aa => aa.ArtistOrder))
                .ThenInclude(aa => aa.Artist)
            .Where(s => EF.Functions.ILike(s.Name, $"%{query}%") ||
                       s.SongArtists.Any(sa => EF.Functions.ILike(sa.Artist.Name, $"%{query}%")))
            .OrderByDescending(s => s.Popularity)
            .Take(20)
            .ToListAsync();

        return songs.Select(song => new SearchResultDto
        {
            Id = song.Id,
            Name = song.Name,
            DurationMs = song.DurationMs,
            Popularity = song.Popularity,
               ImageUrl = song.ImageUrl,
            Artists = song.SongArtists
                   .Select(sa => new ArtistInfoDto
                   {
                       Id = sa.Artist.Id,
                       Name = sa.Artist.Name,
                       ImageUrl = sa.Artist.ImageUrl
                   })
                .ToList(),
            Album = song.Album != null ? new AlbumInfoDto
            {
                Id = song.Album.Id,
                Name = song.Album.Name,
                ReleaseDate = song.Album.ReleaseDate?.ToString("yyyy-MM-dd") ?? "",
                   ImageUrl = song.Album.ImageUrl,
                Artists = song.Album.AlbumArtists
                       .Select(aa => new ArtistInfoDto
                       {
                           Id = aa.Artist.Id,
                           Name = aa.Artist.Name,
                           ImageUrl = aa.Artist.ImageUrl
                       })
                    .ToList()
            } : new AlbumInfoDto(),
            ExternalLinks = song.ExternalLinks != null 
                ? JsonSerializer.Deserialize<Dictionary<string, string>>(song.ExternalLinks) 
                : null
        }).ToList();
    }

    public async Task<Song> CreateOrUpdateAsync(Song song)
    {
        var existing = await _context.Songs.FindAsync(song.Id);
        
        if (existing == null)
        {
            _context.Songs.Add(song);
        }
        else
        {
            _context.Entry(existing).CurrentValues.SetValues(song);
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return song;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Songs.AnyAsync(s => s.Id == id);
    }
}
