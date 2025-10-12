using Microsoft.EntityFrameworkCore;
using RadioPlaysTracker.Core.Interfaces;
using RadioPlaysTracker.Infrastructure.Data;
using RadioPlaysTracker.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure PostgreSQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register repositories
builder.Services.AddScoped<IPlayRepository, PlayRepository>();
builder.Services.AddScoped<ISongRepository, SongRepository>();
builder.Services.AddScoped<IStationRepository, StationRepository>();
builder.Services.AddScoped<IArtistRepository, ArtistRepository>();
builder.Services.AddScoped<IAlbumRepository, AlbumRepository>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "https://localhost:5001",
                "http://localhost:3000",
                "https://mahushma.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
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

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthorization();

//Enable Swagger in all environments (you can restrict this if needed)
app.UseSwagger(options =>
{
    options.RouteTemplate = "{documentName}/swagger.json";
});

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "MaHushma Public API v1.1");
    options.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
});

app.MapControllers();

app.Run();
