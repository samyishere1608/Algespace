#!/bin/bash
# Initialize database on Railway volume if it doesn't exist

VOLUME_DB_PATH="/app/Data/databases/studies.db"
SOURCE_DB_PATH="./Data/databases/studies.db"

# Create directory if it doesn't exist
mkdir -p /app/Data/databases

# Copy database from build to volume if it doesn't exist in volume
if [ ! -f "$VOLUME_DB_PATH" ] && [ -f "$SOURCE_DB_PATH" ]; then
    echo "Copying database to volume..."
    cp "$SOURCE_DB_PATH" "$VOLUME_DB_PATH"
    echo "Database copied successfully"
else
    echo "Database already exists in volume or source not found"
fi

# Start the application
dotnet webapi.dll
