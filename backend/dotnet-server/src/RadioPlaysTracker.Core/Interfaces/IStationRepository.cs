using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Core.Interfaces;

public interface IStationRepository
{
    Task<Station?> GetByNameAsync(string name);
    Task<Station?> GetByIdAsync(int id);
    Task<List<Station>> GetAllAsync();
}
