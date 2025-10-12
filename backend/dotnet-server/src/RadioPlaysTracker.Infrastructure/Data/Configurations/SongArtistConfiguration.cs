using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Infrastructure.Data.Configurations;

public class SongArtistConfiguration : IEntityTypeConfiguration<SongArtist>
{
    public void Configure(EntityTypeBuilder<SongArtist> builder)
    {
        builder.ToTable("song_artists");

        builder.HasKey(sa => new { sa.SongId, sa.ArtistId });

        builder.Property(sa => sa.SongId)
            .HasColumnName("song_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(sa => sa.ArtistId)
            .HasColumnName("artist_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(sa => sa.ArtistOrder)
            .HasColumnName("artist_order")
            .HasDefaultValue(0);

        // Relationships
        builder.HasOne(sa => sa.Song)
            .WithMany(s => s.SongArtists)
            .HasForeignKey(sa => sa.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sa => sa.Artist)
            .WithMany(a => a.SongArtists)
            .HasForeignKey(sa => sa.ArtistId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(sa => sa.ArtistId)
            .HasDatabaseName("idx_song_artists_artist_id");

        builder.HasIndex(sa => sa.SongId)
            .HasDatabaseName("idx_song_artists_song_id");
    }
}
