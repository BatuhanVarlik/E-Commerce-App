# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ETicaret.Domain/ETicaret.Domain.csproj ETicaret.Domain/
COPY ETicaret.Application/ETicaret.Application.csproj ETicaret.Application/
COPY ETicaret.Infrastructure/ETicaret.Infrastructure.csproj ETicaret.Infrastructure/
COPY ETicaret.API/ETicaret.API.csproj ETicaret.API/

RUN dotnet restore ETicaret.API/ETicaret.API.csproj

# Copy everything else and build
COPY . .
WORKDIR /src/ETicaret.API
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Final stage - Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published files
COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p wwwroot/uploads && chown -R appuser:appuser wwwroot

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "ETicaret.API.dll"]
