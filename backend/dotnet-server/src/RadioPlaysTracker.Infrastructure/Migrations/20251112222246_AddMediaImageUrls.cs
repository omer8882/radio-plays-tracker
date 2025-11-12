using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RadioPlaysTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "songs",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "artists",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "albums",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_url",
                table: "songs");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "artists");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "albums");
        }
    }
}
