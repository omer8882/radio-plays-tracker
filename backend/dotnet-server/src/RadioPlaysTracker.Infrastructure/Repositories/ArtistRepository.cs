using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Core.Models;
using RadioPlaysTracker.Infrastructure.Data;

namespace RadioPlaysTracker.Infrastructure.Repositories;

public class AlbumRepository : IAlbumRepository
{
    private readonly AppDbContext _context;

    public AlbumRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Album?> GetByIdAsync(string id)
    {
        return await _context.Albums
            .Include(a => a.AlbumArtists)
                .ThenInclude(aa => aa.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<Album> CreateOrUpdateAsync(Album album)
    {
        var existing = await _context.Albums.FindAsync(album.Id);
        
        if (existing == null)
        {
            _context.Albums.Add(album);
        }
        else
        {
            _context.Entry(existing).CurrentValues.SetValues(album);
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return album;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Albums.AnyAsync(a => a.Id == id);
    }
}
