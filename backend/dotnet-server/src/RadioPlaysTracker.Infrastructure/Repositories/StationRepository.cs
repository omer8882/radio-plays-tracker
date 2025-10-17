using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Core.Models;
using RadioPlaysTracker.Infrastructure.Data;

namespace RadioPlaysTracker.Infrastructure.Repositories;

public class StationRepository : IStationRepository
{
    private readonly AppDbContext _context;

    public StationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Station?> GetByNameAsync(string name)
    {
        return await _context.Stations
            .FirstOrDefaultAsync(s => s.Name == name);
    }

    public async Task<Station?> GetByIdAsync(int id)
    {
        return await _context.Stations.FindAsync(id);
    }

    public async Task<List<Station>> GetAllAsync()
    {
        return await _context.Stations.ToListAsync();
    }
}
