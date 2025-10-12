using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Core.Interfaces;

public interface IArtistRepository
{
    Task<Artist?> GetByIdAsync(string id);
    Task<Artist?> GetByNameAsync(string name);
    Task<List<Artist>> GetByNamesAsync(List<string> names);
    Task<Artist> CreateOrUpdateAsync(Artist artist);
    Task<bool> ExistsAsync(string id);
}
