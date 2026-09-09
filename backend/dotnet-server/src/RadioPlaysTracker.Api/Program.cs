using System;
using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Infrastructure.Data;
using RadioPlaysTracker.Infrastructure.Repositories;
using RadioPlaysTracker.Api.Mcp;
using ModelContextProtocol.Server;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure PostgreSQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Database connection string 'ConnectionStrings:DefaultConnection' is not configured.");
}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register repositories
builder.Services.AddScoped<IPlayRepository, PlayRepository>();
builder.Services.AddScoped<ISongRepository, SongRepository>();
builder.Services.AddScoped<IStationRepository, StationRepository>();
builder.Services.AddScoped<IArtistRepository, ArtistRepository>();
builder.Services.AddScoped<IAlbumRepository, AlbumRepository>();

// Configure MCP Server
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();

// Configure CORS
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// Output caching. The read endpoints are served from aggregate play data that
// changes at most once per recognizer cycle, so short server-side caching removes
// repeated Postgres work when users toggle station/period filters.
builder.Services.AddOutputCache(options =>
{
    // No SetVaryByQuery: the default key covers the whole query string. Naming an
    // explicit subset silently drops the rest from the key, which would serve one
    // artist's or song's payload for another.
    // Vary by Origin so a cached body never carries another origin's CORS header.

    // Recent plays move often; keep this short enough to stay live-feeling.
    options.AddPolicy("RecentPlays", policy => policy
        .Expire(TimeSpan.FromSeconds(30))
        .SetVaryByHeader("Origin"));

    // Aggregates over 7/30 day windows barely move within a few minutes.
    options.AddPolicy("Aggregates", policy => policy
        .Expire(TimeSpan.FromMinutes(5))
        .SetVaryByHeader("Origin"));
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() 
    { 
        Title = "MaHushma Public API",
        Version = "v1.1",
        Description = "API for tracking radio plays"
    });
});

var app = builder.Build();

// Auto-apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors();

// Disable HTTPS redirect in Production when running behind reverse proxy (Cloudflared)
// MCP clients require stable HTTP connection without redirects
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

// Must sit after routing/CORS and before endpoints so cached responses still
// carry the correct CORS headers.
app.UseOutputCache();

//Enable Swagger in all environments (you can restrict this if needed)
app.UseSwagger(options =>
{
    options.RouteTemplate = "{documentName}/swagger.json";
});

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("v1/swagger.json", "MaHushma Public API v1.1");
    options.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
});

app.MapControllers();

// Map MCP endpoint explicitly at /mcp to match Cloudflared routing
app.MapMcp("/mcp");

app.Run();
