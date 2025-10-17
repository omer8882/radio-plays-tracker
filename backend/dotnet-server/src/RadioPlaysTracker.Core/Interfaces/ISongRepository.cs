using RadioPlaysTracker.Core.DTOs;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Core.Interfaces;

public interface ISongRepository
{
    Task<Song?> GetByIdAsync(string id);
    Task<SongDetailsDto?> GetSongDetailsAsync(string id);
    Task<List<SearchResultDto>> SearchAsync(string query);
    Task<Song> CreateOrUpdateAsync(Song song);
    Task<bool> ExistsAsync(string id);
}
