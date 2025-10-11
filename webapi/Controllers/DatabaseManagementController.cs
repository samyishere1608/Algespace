using Microsoft.AspNetCore.Mvc;
using System.Data.SQLite;

namespace webapi.Controllers
{
    [ApiController]
    [Route("api/database")]
    public class DatabaseManagementController : Controller
    {
        private readonly IConfiguration _configuration;

        public DatabaseManagementController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Download the studies.db database file
        /// </summary>
        [HttpGet("download/studies")]
        public IActionResult DownloadStudiesDatabase()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var dbPath = connectionString.Split(';')[0].Replace("Data Source=", "").Trim();

                if (!System.IO.File.Exists(dbPath))
                {
                    return NotFound("Database file not found");
                }

                var fileBytes = System.IO.File.ReadAllBytes(dbPath);
                return File(fileBytes, "application/x-sqlite3", "studies.db");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error downloading database: {ex.Message}");
            }
        }

        /// <summary>
        /// Download the algespace.db database file (exercise data)
        /// </summary>
        [HttpGet("download/algespace")]
        public IActionResult DownloadAlgespaceDatabase()
        {
            try
            {
                var dbPath = Environment.CurrentDirectory + "/Data/databases/algespace.db";

                if (!System.IO.File.Exists(dbPath))
                {
                    return NotFound("Database file not found");
                }

                var fileBytes = System.IO.File.ReadAllBytes(dbPath);
                return File(fileBytes, "application/x-sqlite3", "algespace.db");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error downloading database: {ex.Message}");
            }
        }

        /// <summary>
        /// Clear all user data from studies.db (keeps tables, removes data)
        /// </summary>
        [HttpPost("clear/user-data")]
        public IActionResult ClearUserData([FromBody] string confirmationCode)
        {
            // Safety check - require confirmation code
            if (confirmationCode != "CLEAR_ALL_DATA")
            {
                return BadRequest("Invalid confirmation code. Use 'CLEAR_ALL_DATA' to confirm.");
            }

            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new SQLiteConnection(connectionString);
                connection.Open();

                // Clear all user-generated data
                var tables = new[] { "Goals", "PretestAnswers", "CustomExercises", "Logs" };
                foreach (var table in tables)
                {
                    var command = new SQLiteCommand($"DELETE FROM {table}", connection);
                    var rowsAffected = command.ExecuteNonQuery();
                    Console.WriteLine($"Cleared {rowsAffected} rows from {table}");
                }

                return Ok(new
                {
                    message = "User data cleared successfully",
                    clearedTables = tables
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error clearing data: {ex.Message}");
            }
        }

        /// <summary>
        /// Get database statistics
        /// </summary>
        [HttpGet("stats")]
        public IActionResult GetDatabaseStats()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new SQLiteConnection(connectionString);
                connection.Open();

                var stats = new Dictionary<string, object>();

                // Get row counts for each table
                var tables = new[] { "Goals", "PretestAnswers", "CustomExercises", "Logs" };
                foreach (var table in tables)
                {
                    var command = new SQLiteCommand($"SELECT COUNT(*) FROM {table}", connection);
                    var count = Convert.ToInt32(command.ExecuteScalar());
                    stats[table] = count;
                }

                // Get database file size
                var dbPath = connectionString.Split(';')[0].Replace("Data Source=", "").Trim();
                if (System.IO.File.Exists(dbPath))
                {
                    var fileInfo = new FileInfo(dbPath);
                    stats["DatabaseSize"] = $"{fileInfo.Length / 1024} KB";
                    stats["LastModified"] = fileInfo.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                }

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting stats: {ex.Message}");
            }
        }

        /// <summary>
        /// Export data as CSV
        /// </summary>
        [HttpGet("export/{tableName}")]
        public IActionResult ExportTableToCsv(string tableName)
        {
            try
            {
                // Validate table name to prevent SQL injection
                var allowedTables = new[] { "Goals", "PretestAnswers", "CustomExercises", "Logs" };
                if (!allowedTables.Contains(tableName))
                {
                    return BadRequest($"Invalid table name. Allowed: {string.Join(", ", allowedTables)}");
                }

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new SQLiteConnection(connectionString);
                connection.Open();

                // Get all data from table
                var command = new SQLiteCommand($"SELECT * FROM {tableName}", connection);
                using var reader = command.ExecuteReader();

                // Build CSV
                var csv = new System.Text.StringBuilder();

                // Header row
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    csv.Append(reader.GetName(i));
                    if (i < reader.FieldCount - 1) csv.Append(",");
                }
                csv.AppendLine();

                // Data rows
                while (reader.Read())
                {
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var value = reader.IsDBNull(i) ? "" : reader.GetValue(i).ToString();
                        csv.Append($"\"{value?.Replace("\"", "\"\"")}\"");
                        if (i < reader.FieldCount - 1) csv.Append(",");
                    }
                    csv.AppendLine();
                }

                var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
                return File(bytes, "text/csv", $"{tableName}_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error exporting data: {ex.Message}");
            }
        }
    }
}
