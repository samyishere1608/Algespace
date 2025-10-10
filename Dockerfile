# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the backend project file and restore dependencies
COPY ["webapi/webapi.csproj", "webapi/"]
RUN dotnet restore "webapi/webapi.csproj"

# Copy the entire backend project and build
COPY ./webapi ./webapi
WORKDIR "/src/webapi"
RUN dotnet build "webapi.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "webapi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "webapi.dll"]
