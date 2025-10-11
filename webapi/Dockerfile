FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["webapi.csproj", "./"]
RUN dotnet restore "webapi.csproj"
COPY . .
RUN dotnet build "webapi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "webapi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy initialization script
COPY init-db.sh /app/init-db.sh
RUN chmod +x /app/init-db.sh

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/Data/databases && chmod -R 777 /app/Data/databases

# Explicitly copy database files from build context
COPY --from=build /src/Data/databases/*.db /app/Data/databases/

ENTRYPOINT ["/app/init-db.sh"]
