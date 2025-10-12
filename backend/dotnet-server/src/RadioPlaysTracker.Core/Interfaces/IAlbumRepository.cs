using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Core.Interfaces;

public interface IAlbumRepository
{
    Task<Album?> GetByIdAsync(string id);
    Task<Album> CreateOrUpdateAsync(Album album);
    Task<bool> ExistsAsync(string id);
}
