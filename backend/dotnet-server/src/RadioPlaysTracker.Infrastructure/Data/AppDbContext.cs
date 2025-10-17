using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.Models;
using RadioPlaysTracker.Infrastructure.Data.Configurations;

namespace RadioPlaysTracker.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Artist> Artists => Set<Artist>();
    public DbSet<Album> Albums => Set<Album>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<Station> Stations => Set<Station>();
    public DbSet<Play> Plays => Set<Play>();
    public DbSet<SongArtist> SongArtists => Set<SongArtist>();
    public DbSet<AlbumArtist> AlbumArtists => Set<AlbumArtist>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations
        modelBuilder.ApplyConfiguration(new ArtistConfiguration());
        modelBuilder.ApplyConfiguration(new AlbumConfiguration());
        modelBuilder.ApplyConfiguration(new SongConfiguration());
        modelBuilder.ApplyConfiguration(new StationConfiguration());
        modelBuilder.ApplyConfiguration(new PlayConfiguration());
        modelBuilder.ApplyConfiguration(new SongArtistConfiguration());
        modelBuilder.ApplyConfiguration(new AlbumArtistConfiguration());
    }
}
