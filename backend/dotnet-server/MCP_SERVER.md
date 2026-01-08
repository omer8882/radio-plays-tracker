# MCP Server for Radio Plays Tracker

This document describes the Model Context Protocol (MCP) server implementation for the Radio Plays Tracker application, enabling AI assistants and chatbots to interact with radio play data.

## Overview

The Radio Plays Tracker MCP server exposes the application's API functionality through the Model Context Protocol, allowing AI assistants (like Claude, GPT-4, or local models) to:

- Query recent radio plays by station
- Search for songs and artists
- Get statistics about most played songs
- Find songs played at specific times
- Access detailed song and artist information

## Architecture

The MCP server is integrated directly into the existing ASP.NET Core API using Microsoft's official MCP SDK:

- **Location**: Runs within the main API server (no separate service needed)
- **Endpoint**: Available at `/mcp` HTTP endpoint
- **Transport**: HTTP-based (Server-Sent Events compatible)
- **Implementation**: Uses `ModelContextProtocol.AspNetCore` package (v0.5.0-preview.1)

### Benefits of this approach:

1. **Low latency** - MCP tools directly access the same repositories as REST controllers
2. **Simple deployment** - No additional service to manage
3. **Code reuse** - Leverages existing business logic and data access layers
4. **Type safety** - C# strong typing throughout

## Available Tools

The MCP server exposes 10 tools for interacting with radio play data:

### 1. GetStationLastPlays
Get recent plays from a specific radio station.

**Parameters:**
- `station` (string, required): Station name (glglz, eco99, 100fm, galatz, 103fm, kan88)
- `limit` (int, optional): Max plays to return (default: 10, max: 25)
- `page` (int, optional): Page number (default: 0)

**Example:**
```json
{
  "station": "glglz",
  "limit": 10,
  "page": 0
}
```

### 2. SearchSongs
Search for songs by title or artist name using fuzzy matching.

**Parameters:**
- `query` (string, required): Search term

**Example:**
```json
{
  "query": "imagine dragons"
}
```

### 3. GetTopHits
Get the most played songs within a time period.

**Parameters:**
- `days` (int, optional): Days to look back (default: 7)
- `topN` (int, optional): Number of results (default: 5)

**Example:**
```json
{
  "days": 30,
  "topN": 10
}
```

### 4. GetSongDetails
Get detailed information about a specific song.

**Parameters:**
- `songId` (string, required): Spotify song ID

**Example:**
```json
{
  "songId": "3n3Ppam7vgaVa1iaRUc9Lp"
}
```

### 5. SearchAroundTimestamp
Find songs played around a specific time (useful for "what was playing" queries).

**Parameters:**
- `station` (string, required): Station name
- `timestamp` (string, required): ISO format timestamp (e.g., "2024-01-15T14:30:00")
- `rangeMinutes` (int, optional): Time range before/after (default: 15)

**Example:**
```json
{
  "station": "glglz",
  "timestamp": "2024-01-15T14:30:00",
  "rangeMinutes": 15
}
```

### 6. GetArtistDetails
Get artist profile information including image.

**Parameters:**
- `id` (string, optional): Spotify artist ID
- `name` (string, optional): Artist name

*Note: Either id or name must be provided*

**Example:**
```json
{
  "name": "Coldplay"
}
```

### 7. GetArtistTopHits
Get the most played songs for a specific artist.

**Parameters:**
- `artist` (string, required): Artist name
- `days` (int, optional): Days to look back (null = all time)
- `limit` (int, optional): Max results (default: 10)

**Example:**
```json
{
  "artist": "Radiohead",
  "days": 30,
  "limit": 10
}
```

### 8. GetAllStations
Get a list of all monitored radio stations.

**Parameters:** None

**Example:**
```json
{}
```

### 9. GetTopSongs
Get paginated top songs with station breakdowns.

**Parameters:**
- `days` (int, optional): Days to look back (default: 7)
- `station` (string, optional): Filter by station (default: all)
- `limit` (int, optional): Page size (default: 25, max: 50)
- `page` (int, optional): Page index (default: 0)

**Example:**
```json
{
  "days": 7,
  "limit": 25,
  "page": 0
}
```

### 10. GetSongPlaysByStation
Get play count breakdown by station for a song.

**Parameters:**
- `songId` (string, required): Spotify song ID
- `days` (int, optional): Days to look back (null = all time)

**Example:**
```json
{
  "songId": "3n3Ppam7vgaVa1iaRUc9Lp",
  "days": 30
}
```

## Setup & Configuration

### Installation

The MCP server is already integrated into the API. No additional installation is required.

Required NuGet packages (already added):
```xml
<PackageReference Include="ModelContextProtocol" Version="0.5.0-preview.1" />
<PackageReference Include="ModelContextProtocol.AspNetCore" Version="0.5.0-preview.1" />
```

### Configuration

The MCP server is configured in `Program.cs`:

```csharp
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();

// ...

app.MapMcp(); // Exposes /mcp endpoint
```

### Running the Server

Start the API server normally:

```bash
cd backend/dotnet-server/src/RadioPlaysTracker.Api
dotnet run
```

The MCP endpoint will be available at:
- Development: `https://localhost:5001/mcp` or `http://localhost:5000/mcp`
- Production: `https://your-domain.com/mcp`

## Connecting MCP Clients

### Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "radio-plays-tracker": {
      "url": "http://localhost:5000/mcp"
    }
  }
}
```

### Custom MCP Clients

Use the MCP C# SDK to connect programmatically:

```csharp
using ModelContextProtocol.Client;

var clientTransport = new HttpClientTransport(new Uri("http://localhost:5000/mcp"));
var client = await McpClient.CreateAsync(clientTransport);

// List available tools
var tools = await client.ListToolsAsync();
foreach (var tool in tools)
{
    Console.WriteLine($"{tool.Name}: {tool.Description}");
}

// Call a tool
var result = await client.CallToolAsync(
    "GetStationLastPlays",
    new Dictionary<string, object?> 
    { 
        ["station"] = "glglz",
        ["limit"] = 10
    });
```

### Using with LLMs

The tools can be used directly with LLM chat clients:

```csharp
using Microsoft.Extensions.AI;

IChatClient chatClient = /* your LLM client */;
var mcpClient = await McpClient.CreateAsync(transport);
var tools = await mcpClient.ListToolsAsync();

var response = await chatClient.GetResponseAsync(
    "What were the top songs played on glglz yesterday?",
    new ChatOptions { Tools = tools.ToList() });
```

## Example Use Cases

### 1. Find a song you heard at a specific time
**User query:** "What was playing on glglz around 2PM yesterday?"

**MCP tool calls:**
1. `SearchAroundTimestamp` with station="glglz", timestamp="2024-01-14T14:00:00"

### 2. Get trending music
**User query:** "What are the most popular songs this week?"

**MCP tool calls:**
1. `GetTopHits` with days=7, topN=10

### 3. Explore an artist
**User query:** "Show me Radiohead's most played songs"

**MCP tool calls:**
1. `GetArtistDetails` with name="Radiohead"
2. `GetArtistTopHits` with artist="Radiohead"

### 4. Station insights
**User query:** "Which stations played 'Bohemian Rhapsody' the most this month?"

**MCP tool calls:**
1. `SearchSongs` with query="Bohemian Rhapsody"
2. `GetSongPlaysByStation` with the song ID, days=30

## Response Format

All tools return JSON responses with a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { /* tool-specific data */ },
  "message": "Human-readable success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description"
}
```

## Development

### Adding New Tools

To add a new MCP tool:

1. Add a method to `Mcp/RadioPlaysTools.cs`
2. Annotate with `[McpServerTool]` and `[Description]`
3. Add parameter descriptions with `[Description]` attributes
4. Return a JSON string with success/error structure

Example:

```csharp
[McpServerTool]
[Description("Your tool description")]
public async Task<string> YourNewTool(
    [Description("Parameter description")] string param1)
{
    var result = await _repository.YourMethodAsync(param1);
    return JsonSerializer.Serialize(new
    {
        success = true,
        data = result,
        message = "Success message"
    });
}
```

### Testing Tools

Test MCP tools using the SDK client or via HTTP:

```bash
# Using curl (requires proper MCP protocol formatting)
curl -X POST http://localhost:5000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

## Troubleshooting

### MCP endpoint not responding
- Ensure the API server is running
- Check that `app.MapMcp()` is called in Program.cs
- Verify CORS settings if accessing from browser

### Tool not appearing in client
- Check that the method has `[McpServerTool]` attribute
- Ensure the class has `[McpServerToolType]` attribute
- Verify the assembly is scanned with `.WithToolsFromAssembly()`

### Database connection errors
- Verify database connection string in appsettings
- Ensure PostgreSQL is running
- Check that migrations are applied

## Security Considerations

- **Authentication**: Currently no authentication on MCP endpoint (same as REST API)
- **Rate Limiting**: Consider adding rate limiting for production deployments
- **CORS**: Configure CORS appropriately in production
- **Data Sensitivity**: Tools expose public radio play data only

## Performance

- **Low Latency**: MCP tools use the same in-process repositories as REST controllers
- **Caching**: Consider adding response caching for frequently accessed data
- **Connection Pooling**: EF Core handles database connection pooling automatically

## Future Enhancements

Potential improvements to consider:

1. **Authentication**: Add API key or OAuth support for MCP endpoint
2. **WebSocket Transport**: Add WebSocket support for bidirectional communication
3. **Streaming Responses**: Implement streaming for large result sets
4. **More Tools**: Add tools for creating playlists, user preferences, etc.
5. **Prompt Templates**: Add MCP prompts for common queries
6. **Resource Support**: Expose station streams or playlist data as MCP resources

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/)
- [MCP C# SDK Documentation](https://modelcontextprotocol.github.io/csharp-sdk/)
- [MCP AspNetCore Package](https://www.nuget.org/packages/ModelContextProtocol.AspNetCore/)
- [Building MCP Servers in C#](https://devblogs.microsoft.com/dotnet/build-a-model-context-protocol-mcp-server-in-csharp/)

## License

This MCP server implementation is part of the Radio Plays Tracker project and follows the same MIT License.
