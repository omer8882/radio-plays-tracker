# MCP Server Quick Start Guide

This guide will help you quickly test the Radio Plays Tracker MCP server.

## Prerequisites

- .NET 8 SDK or later installed
- PostgreSQL database running (see main README for setup)
- Radio Plays Tracker API running

## Step 1: Start the API Server

```bash
cd backend/dotnet-server/src/RadioPlaysTracker.Api
dotnet run
```

The MCP endpoint will be available at `http://localhost:5000/mcp` or `https://localhost:5001/mcp`.

## Step 2: Test with a Simple MCP Client

### Option A: Using cURL (Manual Testing)

The MCP protocol uses JSON-RPC 2.0 over HTTP. Here's how to list available tools:

```bash
curl -X POST http://localhost:5000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### Option B: Using the MCP C# SDK

Create a test console app:

```bash
mkdir mcp-client-test
cd mcp-client-test
dotnet new console
dotnet add package ModelContextProtocol --prerelease
```

Replace Program.cs with:

```csharp
using ModelContextProtocol.Client;
using System.Text.Json;

// Create HTTP client transport
var httpClient = new HttpClient();
httpClient.BaseAddress = new Uri("http://localhost:5000");

var transport = new HttpClientTransport(httpClient, "/mcp");

try
{
    // Connect to the MCP server
    var client = await McpClient.CreateAsync(transport);
    
    Console.WriteLine("Connected to Radio Plays Tracker MCP Server!");
    Console.WriteLine();
    
    // List all available tools
    Console.WriteLine("Available Tools:");
    Console.WriteLine("================");
    var tools = await client.ListToolsAsync();
    foreach (var tool in tools)
    {
        Console.WriteLine($"\n{tool.Name}");
        Console.WriteLine($"  Description: {tool.Description}");
    }
    
    Console.WriteLine("\n\nCalling GetAllStations tool...");
    Console.WriteLine("================================");
    
    // Call a tool
    var result = await client.CallToolAsync(
        "GetAllStations",
        new Dictionary<string, object?>(),
        cancellationToken: CancellationToken.None);
    
    // Display result
    foreach (var content in result.Content)
    {
        if (content is TextContentBlock textContent)
        {
            var json = JsonDocument.Parse(textContent.Text);
            Console.WriteLine(json.RootElement.GetProperty("data").ToString());
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
```

Run it:

```bash
dotnet run
```

### Option C: Using Claude Desktop

1. Open Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the MCP server:

```json
{
  "mcpServers": {
    "radio-plays": {
      "command": "dotnet",
      "args": [
        "run",
        "--project",
        "/full/path/to/radio-plays-tracker/backend/dotnet-server/src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj"
      ]
    }
  }
}
```

3. Restart Claude Desktop

4. In a new conversation, ask Claude:
   - "What tools do you have access to?"
   - "What are the top songs played on glglz today?"
   - "Search for songs by Radiohead"

## Step 3: Test Specific Tools

### Example 1: Get Recent Plays

```bash
curl -X POST http://localhost:5000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "GetStationLastPlays",
      "arguments": {
        "station": "glglz",
        "limit": 5
      }
    }
  }'
```

### Example 2: Search for Songs

```bash
curl -X POST http://localhost:5000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "SearchSongs",
      "arguments": {
        "query": "radiohead"
      }
    }
  }'
```

### Example 3: Get Top Hits

```bash
curl -X POST http://localhost:5000/mcp \
  -H "Content-Type": "application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "GetTopHits",
      "arguments": {
        "days": 7,
        "topN": 10
      }
    }
  }'
```

## Troubleshooting

### Server not responding
- Check that the API is running: `dotnet run` should show "Now listening on: http://localhost:5000"
- Verify database is running and migrations are applied
- Check logs for any errors

### "Connection refused" error
- Make sure you're using the correct URL (http://localhost:5000/mcp)
- Try https://localhost:5001/mcp if using HTTPS

### Tools not showing up
- Verify build succeeded without errors
- Check that `app.MapMcp()` is called in Program.cs
- Ensure `[McpServerToolType]` is on the RadioPlaysTools class

### Database errors
- Ensure PostgreSQL is running
- Verify connection string in appsettings.json
- Run migrations: `dotnet ef database update`

## Next Steps

1. **Integrate with your UI**: Add a chatbot component that connects to the MCP server
2. **Add more tools**: Extend RadioPlaysTools.cs with additional functionality
3. **Deploy**: Configure for production deployment (see MCP_SERVER.md)
4. **Optimize**: Add caching, rate limiting, authentication as needed

## Example Chatbot Queries

Once connected, you can ask natural language questions like:

- "What's playing on glglz right now?"
- "Show me the top 10 songs from the last week"
- "What was playing on 103fm yesterday at 3pm?"
- "Search for songs by The Beatles"
- "Which stations play the most Coldplay?"
- "Get me details about the song with ID xyz123"

The MCP server will automatically call the appropriate tools and return formatted responses!

## Resources

- [Full MCP Server Documentation](./MCP_SERVER.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification/)
- [MCP C# SDK](https://github.com/modelcontextprotocol/csharp-sdk)
