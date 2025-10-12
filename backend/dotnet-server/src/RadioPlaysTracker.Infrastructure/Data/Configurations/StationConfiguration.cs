using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RadioPlaysTracker.Core.Models;

namespace RadioPlaysTracker.Infrastructure.Data.Configurations;

public class StationConfiguration : IEntityTypeConfiguration<Station>
{
    public void Configure(EntityTypeBuilder<Station> builder)
    {
        builder.ToTable("stations");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(200);

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Unique constraint
        builder.HasIndex(s => s.Name)
            .IsUnique();
    }
}
