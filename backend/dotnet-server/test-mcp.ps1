#!/usr/bin/env pwsh
# Test script for MCP server connectivity

param(
    [string]$BaseUrl = "https://server.mahushma.com"
)

Write-Host "Testing MCP Server Connectivity" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Basic API Health
Write-Host "1. Testing API Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
    Write-Host "   [OK] API is healthy" -ForegroundColor Green
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
    Write-Host "   Environment: $($response.environment)`n" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] API health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Cannot proceed with MCP tests`n" -ForegroundColor Red
    exit 1
}

# Test 2: MCP Health Check
Write-Host "2. Testing MCP Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/health/mcp" -Method Get
    Write-Host "   [OK] MCP health endpoint accessible" -ForegroundColor Green
    Write-Host "   MCP Endpoint: $($response.mcpEndpoint)`n" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] MCP health endpoint failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: MCP JSON-RPC - Initialize
Write-Host "3. Testing MCP JSON-RPC Initialize..." -ForegroundColor Yellow
$initBody = @{
    jsonrpc = "2.0"
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{
            name = "test-client"
            version = "1.0.0"
        }
    }
    id = 1
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method Post -Body $initBody -ContentType "application/json"
    Write-Host "   [OK] MCP Initialize successful" -ForegroundColor Green
    Write-Host "   Server: $($response.result.serverInfo.name) v$($response.result.serverInfo.version)`n" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] MCP Initialize failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 4: MCP JSON-RPC - List Tools
Write-Host "4. Testing MCP Tools List..." -ForegroundColor Yellow
$toolsBody = @{
    jsonrpc = "2.0"
    method = "tools/list"
    id = 2
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method Post -Body $toolsBody -ContentType "application/json"
    $toolCount = $response.result.tools.Count
    Write-Host "   [OK] MCP Tools List successful" -ForegroundColor Green
    Write-Host "   Found $toolCount tools:" -ForegroundColor Gray
    foreach ($tool in $response.result.tools | Select-Object -First 5) {
        Write-Host "   - $($tool.name)" -ForegroundColor Gray
    }
    if ($toolCount -gt 5) {
        Write-Host "   ... and $($toolCount - 5) more`n" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
} catch {
    Write-Host "   [FAIL] MCP Tools List failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 5: MCP Tool Call
Write-Host "5. Testing MCP Tool Call (GetAllStations)..." -ForegroundColor Yellow
$callBody = @{
    jsonrpc = "2.0"
    method = "tools/call"
    params = @{
        name = "GetAllStations"
        arguments = @{}
    }
    id = 3
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/mcp" -Method Post -Body $callBody -ContentType "application/json"
    Write-Host "   [OK] MCP Tool Call successful" -ForegroundColor Green
    $result = $response.result.content[0].text | ConvertFrom-Json
    if ($result.success) {
        Write-Host "   Stations: $($result.data.Count) found" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   [FAIL] MCP Tool Call failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - If all tests pass: Configure your MCP client" -ForegroundColor White
Write-Host "    URL: $BaseUrl/mcp" -ForegroundColor Cyan
Write-Host "  - If tests fail: Check Docker logs" -ForegroundColor White
Write-Host "    API: docker logs mahushma-api" -ForegroundColor Gray
Write-Host "    Tunnel: docker logs mahushma-cloudflared" -ForegroundColor Gray

