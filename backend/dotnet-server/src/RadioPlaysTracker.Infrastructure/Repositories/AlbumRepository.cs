using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Core.Models;
using RadioPlaysTracker.Infrastructure.Data;

namespace RadioPlaysTracker.Infrastructure.Repositories;

public class ArtistRepository : IArtistRepository
{
    private readonly AppDbContext _context;

    public ArtistRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Artist?> GetByIdAsync(string id)
    {
        return await _context.Artists.FindAsync(id);
    }

    public async Task<Artist?> GetByNameAsync(string name)
    {
        return await _context.Artists
            .FirstOrDefaultAsync(a => a.Name.ToLower() == name.ToLower());
    }

    public async Task<List<Artist>> GetByNamesAsync(List<string> names)
    {
        var lowerNames = names.Select(n => n.ToLower()).ToList();
        return await _context.Artists
            .Where(a => lowerNames.Contains(a.Name.ToLower()))
            .ToListAsync();
    }

    public async Task<Artist> CreateOrUpdateAsync(Artist artist)
    {
        var existing = await _context.Artists.FindAsync(artist.Id);
        
        if (existing == null)
        {
            _context.Artists.Add(artist);
        }
        else
        {
            _context.Entry(existing).CurrentValues.SetValues(artist);
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return artist;
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.Artists.AnyAsync(a => a.Id == id);
    }
}
