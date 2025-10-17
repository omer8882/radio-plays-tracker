using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Infrastructure.Data.Configurations;

public class SongConfiguration : IEntityTypeConfiguration<Song>
{
    public void Configure(EntityTypeBuilder<Song> builder)
    {
        builder.ToTable("songs");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.AlbumId)
            .HasColumnName("album_id")
            .HasMaxLength(255);

        builder.Property(s => s.DurationMs)
            .HasColumnName("duration_ms");

        builder.Property(s => s.Popularity)
            .HasColumnName("popularity");

        builder.Property(s => s.ExternalLinks)
            .HasColumnName("external_links")
            .HasColumnType("jsonb");

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("timestamp without time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(s => s.Album)
            .WithMany(a => a.Songs)
            .HasForeignKey(s => s.AlbumId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(s => s.Name)
            .HasDatabaseName("idx_songs_name");

        builder.HasIndex(s => s.AlbumId)
            .HasDatabaseName("idx_songs_album_id");

        builder.HasIndex(s => s.Popularity)
            .HasDatabaseName("idx_songs_popularity")
            .IsDescending();
    }
}
