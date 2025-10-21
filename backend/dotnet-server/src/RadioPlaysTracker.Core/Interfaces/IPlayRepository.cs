using RadioPlaysTracker.Core.DTOs;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Core.Interfaces;

public interface IPlayRepository
{
    Task<PaginatedResult<PlayDto>> GetStationPlaysAsync(string stationName, int page, int pageSize);
    Task<List<PlayDto>> GetArtistPlaysAsync(string artistName, int limit = 100);
    Task<List<TopHitDto>> GetTopHitsAsync(int days = 7, int topN = 5);
    Task<List<TopHitDto>> GetArtistTopHitsAsync(string artistName, int? days = null, int limit = 10);
    Task<Dictionary<string, int>> GetSongPlaysByStationAsync(string songId, int? days = null);
    Task<List<SongDetailsDto>> SearchAroundAsync(string stationName, DateTime timestamp, int rangeMinutes = 15);
    Task<Play> CreateAsync(Play play);
    Task<bool> PlayExistsAsync(string songId, int stationId, DateTime playedAt);
}
