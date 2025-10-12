using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Infrastructure.Data.Configurations;

public class PlayConfiguration : IEntityTypeConfiguration<Play>
{
    public void Configure(EntityTypeBuilder<Play> builder)
    {
        builder.ToTable("plays");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(p => p.SongId)
            .HasColumnName("song_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(p => p.StationId)
            .HasColumnName("station_id")
            .IsRequired();

        builder.Property(p => p.PlayedAt)
            .HasColumnName("played_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(p => p.Song)
            .WithMany(s => s.Plays)
            .HasForeignKey(p => p.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Station)
            .WithMany(s => s.Plays)
            .HasForeignKey(p => p.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint
        builder.HasIndex(p => new { p.SongId, p.StationId, p.PlayedAt })
            .IsUnique()
            .HasDatabaseName("unique_play");

        // Indexes for performance
        builder.HasIndex(p => p.SongId)
            .HasDatabaseName("idx_plays_song_id");

        builder.HasIndex(p => p.StationId)
            .HasDatabaseName("idx_plays_station_id");

        builder.HasIndex(p => p.PlayedAt)
            .HasDatabaseName("idx_plays_played_at")
            .IsDescending();

        builder.HasIndex(p => new { p.StationId, p.PlayedAt })
            .HasDatabaseName("idx_plays_station_played_at")
            .IsDescending();
    }
}
