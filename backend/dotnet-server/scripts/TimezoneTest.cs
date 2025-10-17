using System.Runtime.InteropServices;

namespace RadioPlaysTracker.Tests;

/// <summary>
/// Quick test to verify Israel timezone handling works correctly
/// Run this to verify the timezone is configured properly
/// </summary>
public class TimezoneTest
{
    public static void Main(string[] args)
    {
        Console.WriteLine("=== Timezone Configuration Test ===\n");

        // Show current server info
        Console.WriteLine($"Operating System: {RuntimeInformation.OSDescription}");
        Console.WriteLine($"Platform: {(RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "Windows" : "Linux/Unix")}");
        Console.WriteLine();

        // Test timezone detection
        try
        {
            var israelTz = GetIsraelTimeZone();
            Console.WriteLine($"✓ Israel Timezone Found: {israelTz.Id}");
            Console.WriteLine($"  Display Name: {israelTz.DisplayName}");
            Console.WriteLine($"  Base UTC Offset: {israelTz.BaseUtcOffset}");
            Console.WriteLine($"  Supports DST: {israelTz.SupportsDaylightSavingTime}");
            Console.WriteLine();

            // Show current times
            var utcNow = DateTime.UtcNow;
            var israelNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, israelTz);
            var localNow = DateTime.Now;

            Console.WriteLine("=== Current Times ===");
            Console.WriteLine($"UTC Time:        {utcNow:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"Israel Time:     {israelNow:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"Server Local:    {localNow:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine();

            // Calculate offset
            var offset = israelNow - utcNow;
            Console.WriteLine($"Israel is currently UTC{(offset.TotalHours >= 0 ? "+" : "")}{offset.TotalHours} hours");
            Console.WriteLine(offset.TotalHours == 3 ? "(Summer Time - DST Active)" : "(Standard Time)");
            Console.WriteLine();

            Console.WriteLine("✓ All timezone tests passed!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"✗ Error: {ex.Message}");
            Console.WriteLine("\nTroubleshooting:");
            Console.WriteLine("- On Windows: Ensure Windows is up to date");
            Console.WriteLine("- On Linux: Install tzdata package (apt-get install tzdata)");
        }
    }

    private static TimeZoneInfo GetIsraelTimeZone()
    {
        try
        {
            return RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? TimeZoneInfo.FindSystemTimeZoneById("Israel Standard Time")
                : TimeZoneInfo.FindSystemTimeZoneById("Asia/Jerusalem");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(
                    RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                        ? "Asia/Jerusalem"
                        : "Israel Standard Time");
            }
            catch
            {
                throw new InvalidOperationException(
                    "Could not find Israel timezone. Ensure timezone data is installed.");
            }
        }
    }
}
