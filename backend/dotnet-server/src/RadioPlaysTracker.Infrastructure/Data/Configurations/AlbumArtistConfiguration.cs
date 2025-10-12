using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Infrastructure.Data.Configurations;

public class AlbumArtistConfiguration : IEntityTypeConfiguration<AlbumArtist>
{
    public void Configure(EntityTypeBuilder<AlbumArtist> builder)
    {
        builder.ToTable("album_artists");

        builder.HasKey(aa => new { aa.AlbumId, aa.ArtistId });

        builder.Property(aa => aa.AlbumId)
            .HasColumnName("album_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(aa => aa.ArtistId)
            .HasColumnName("artist_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(aa => aa.ArtistOrder)
            .HasColumnName("artist_order")
            .HasDefaultValue(0);

        // Relationships
        builder.HasOne(aa => aa.Album)
            .WithMany(a => a.AlbumArtists)
            .HasForeignKey(aa => aa.AlbumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(aa => aa.Artist)
            .WithMany(a => a.AlbumArtists)
            .HasForeignKey(aa => aa.ArtistId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(aa => aa.ArtistId)
            .HasDatabaseName("idx_album_artists_artist_id");

        builder.HasIndex(aa => aa.AlbumId)
            .HasDatabaseName("idx_album_artists_album_id");
    }
}
