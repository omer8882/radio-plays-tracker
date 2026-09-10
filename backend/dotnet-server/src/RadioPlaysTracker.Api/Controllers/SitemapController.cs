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

            foreach (var station in Constants.StationNames)
            {
                WriteUrl(writer, $"{baseUrl}/station/{station}", null, "daily", "0.8");
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

internal static class Constants
{
    // Stations with a public page. 103fm is excluded: it has historical plays
    // but is no longer polled, so its page would be a dead archive.
    public static readonly string[] StationNames = ["glglz", "eco99", "100fm", "kan88", "galatz"];
}
