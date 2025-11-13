# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY RadioPlaysTracker.sln ./
COPY src/RadioPlaysTracker.Core/RadioPlaysTracker.Core.csproj src/RadioPlaysTracker.Core/
COPY src/RadioPlaysTracker.Infrastructure/RadioPlaysTracker.Infrastructure.csproj src/RadioPlaysTracker.Infrastructure/
COPY src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj src/RadioPlaysTracker.Api/

RUN dotnet restore src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj

COPY src ./src
RUN dotnet publish src/RadioPlaysTracker.Api/RadioPlaysTracker.Api.csproj -c Release -o /app/publish --no-restore

COPY src/RadioPlaysTracker.Infrastructure/Migrations /app/publish/Migrations

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish ./

EXPOSE 8080

ENTRYPOINT ["dotnet", "RadioPlaysTracker.Api.dll"]
