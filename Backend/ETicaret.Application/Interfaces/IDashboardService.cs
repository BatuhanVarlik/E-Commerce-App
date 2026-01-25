using ETicaret.Application.DTOs.Admin;

namespace ETicaret.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
}
