using RadioPlaysTracker.Core.DTOs;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Core.Interfaces;

public interface IPlayRepository
{
    Task<List<PlayDto>> GetLastPlaysFromStationAsync(string stationName, int limit = 10);
    Task<List<PlayDto>> GetArtistPlaysAsync(string artistName, int limit = 100);
    Task<List<TopHitDto>> GetTopHitsAsync(int days = 7, int topN = 5);
    Task<Dictionary<string, int>> GetSongPlaysByStationAsync(string songId, int? days = null);
    Task<List<SongDetailsDto>> SearchAroundAsync(string stationName, DateTime timestamp, int rangeMinutes = 15);
    Task<Play> CreateAsync(Play play);
    Task<bool> PlayExistsAsync(string songId, int stationId, DateTime playedAt);
}
