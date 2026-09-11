using System.Text;
using System.Xml;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using RadioPlaysTracker.Core.Interfaces;

namespace RadioPlaysTracker.Api.Controllers;

/// <summary>
/// Generates sitemap.xml from the database rather than at build time.
///
/// The catalogue is ~94k songs and ~40k artists, far more than is worth
/// submitting or than a build could prerender. This deliberately publishes a
/// bounded, recency-weighted slice: the songs people are plausibly searching
/// for now, rather than everything ever recorded.
/// </summary>
[ApiController]
public class SitemapController : ControllerBase
{
    private readonly IPlayRepository _playRepository;

    // Sitemaps cap at 50,000 URLs per file. We stay well under so a single file
    // remains valid and no sitemap index is needed.
    private const int MaxSongs = 2000;
    private const int MaxArtists = 500;
    private const int DefaultWindowDays = 365;
    private const int StationStaleAfterDays = 30;

    private static readonly string[] StaticPaths = ["/", "/top-hits"];

    public SitemapController(IPlayRepository playRepository)
    {
        _playRepository = playRepository;
    }

    [HttpGet("sitemap.xml")]
    [OutputCache(Duration = 3600)]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap(
        [FromQuery] int songs = MaxSongs,
        [FromQuery] int artists = MaxArtists,
        [FromQuery] int days = DefaultWindowDays)
    {
        songs = Math.Clamp(songs, 0, 10000);
        artists = Math.Clamp(artists, 0, 5000);
        days = Math.Clamp(days, 1, 3650);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        var topSongs = await _playRepository.GetTopSongsAsync(days, null, 0, songs);
        var topArtists = await _playRepository.GetTopArtistsAsync(days, null, 0, artists);

        var settings = new XmlWriterSettings { Indent = true, Encoding = new UTF8Encoding(false), Async = true };
        var buffer = new Utf8StringWriter();
        using (var writer = XmlWriter.Create(buffer, settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement("urlset", "http://www.sitemaps.org/schemas/sitemap/0.9");

            foreach (var path in StaticPaths)
            {
                WriteUrl(writer, $"{baseUrl}{path}", null, path == "/" ? "daily" : "daily", path == "/" ? "1.0" : "0.9");
            }

            // Stations come from the database. A station whose last play is long
            // past (103fm) is no longer polled, so its page is a dead archive and
            // is left out rather than advertised to crawlers.
            var staleCutoff = DateTime.UtcNow.AddDays(-StationStaleAfterDays);
            foreach (var station in await _playRepository.GetStationSummariesAsync())
            {
                if (station.LastPlayedAt is null || station.LastPlayedAt < staleCutoff)
                {
                    continue;
                }
                WriteUrl(writer, $"{baseUrl}/station/{station.Name}", station.LastPlayedAt, "daily", "0.8");
            }

            foreach (var song in topSongs.Items)
            {
                WriteUrl(writer, $"{baseUrl}/song/{Uri.EscapeDataString(song.Id)}", song.LastPlayedAt, "weekly", "0.7");
            }

            foreach (var artist in topArtists.Items)
            {
                WriteUrl(writer, $"{baseUrl}/artist/{Uri.EscapeDataString(artist.Id)}", null, "weekly", "0.6");
            }

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }

        return Content(buffer.ToString(), "application/xml", Encoding.UTF8);
    }

    /// <summary>
    /// StringWriter reports UTF-16, which XmlWriter then declares in the prolog
    /// while the response is served as UTF-8 — producing a document parsers
    /// reject. This makes the declared encoding match what is actually sent.
    /// </summary>
    private sealed class Utf8StringWriter : StringWriter
    {
        public override Encoding Encoding => Encoding.UTF8;
    }

    private static void WriteUrl(XmlWriter writer, string loc, DateTime? lastModified, string changeFreq, string priority)
    {
        writer.WriteStartElement("url");
        writer.WriteElementString("loc", loc);
        if (lastModified.HasValue)
        {
            writer.WriteElementString("lastmod", lastModified.Value.ToString("yyyy-MM-dd"));
        }
        writer.WriteElementString("changefreq", changeFreq);
        writer.WriteElementString("priority", priority);
        writer.WriteEndElement();
    }
}

