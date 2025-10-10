using System.Data.SQLite;

namespace webapi.Helpers
{
    /// <summary>
    /// Helper class to handle SQLite "database is locked" errors with exponential backoff retry logic.
    /// Critical for supporting concurrent users (50-60 students) in a classroom environment.
    /// </summary>
    public static class SQLiteRetryHelper
    {
        private const int MaxRetries = 15;  // Maximum number of retry attempts (increased for heavy load)
        private const int InitialDelayMs = 5;  // Initial delay between retries (reduced for faster response)
        private const int MaxDelayMs = 500;  // Maximum delay between retries (reduced to handle bursts better)

        /// <summary>
        /// Executes a database operation with automatic retry on "database is locked" errors.
        /// Uses exponential backoff to reduce contention.
        /// </summary>
        /// <typeparam name="T">Return type of the operation</typeparam>
        /// <param name="operation">The database operation to execute</param>
        /// <returns>Result of the operation</returns>
        public static T ExecuteWithRetry<T>(Func<T> operation)
        {
            int attempt = 0;
            int delayMs = InitialDelayMs;

            while (true)
            {
                try
                {
                    return operation();
                }
                catch (SQLiteException ex) when (ex.ResultCode == SQLiteErrorCode.Busy || 
                                                  ex.ResultCode == SQLiteErrorCode.Locked)
                {
                    attempt++;
                    
                    if (attempt >= MaxRetries)
                    {
                        // After max retries, throw with helpful message
                        throw new InvalidOperationException(
                            $"Database operation failed after {MaxRetries} retry attempts. " +
                            $"This may indicate high database contention. " +
                            $"Original error: {ex.Message}", ex);
                    }

                    // Exponential backoff with jitter to reduce contention
                    var jitter = Random.Shared.Next(0, 10);  // Add 0-10ms random jitter
                    Thread.Sleep(delayMs + jitter);
                    
                    // Double the delay for next attempt, up to max
                    delayMs = Math.Min(delayMs * 2, MaxDelayMs);
                }
            }
        }

        /// <summary>
        /// Executes an async database operation with automatic retry on "database is locked" errors.
        /// Uses exponential backoff to reduce contention.
        /// </summary>
        /// <typeparam name="T">Return type of the operation</typeparam>
        /// <param name="operation">The async database operation to execute</param>
        /// <returns>Result of the operation</returns>
        public static async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation)
        {
            int attempt = 0;
            int delayMs = InitialDelayMs;

            while (true)
            {
                try
                {
                    return await operation();
                }
                catch (SQLiteException ex) when (ex.ResultCode == SQLiteErrorCode.Busy || 
                                                  ex.ResultCode == SQLiteErrorCode.Locked)
                {
                    attempt++;
                    
                    if (attempt >= MaxRetries)
                    {
                        // After max retries, throw with helpful message
                        throw new InvalidOperationException(
                            $"Database operation failed after {MaxRetries} retry attempts. " +
                            $"This may indicate high database contention. " +
                            $"Original error: {ex.Message}", ex);
                    }

                    // Exponential backoff with jitter to reduce contention
                    var jitter = Random.Shared.Next(0, 10);  // Add 0-10ms random jitter
                    await Task.Delay(delayMs + jitter);
                    
                    // Double the delay for next attempt, up to max
                    delayMs = Math.Min(delayMs * 2, MaxDelayMs);
                }
            }
        }

        /// <summary>
        /// Executes a void database operation with automatic retry on "database is locked" errors.
        /// </summary>
        /// <param name="operation">The database operation to execute</param>
        public static void ExecuteWithRetry(Action operation)
        {
            ExecuteWithRetry(() =>
            {
                operation();
                return true;  // Dummy return value
            });
        }

        /// <summary>
        /// Executes an async void database operation with automatic retry on "database is locked" errors.
        /// </summary>
        /// <param name="operation">The async database operation to execute</param>
        public static async Task ExecuteWithRetryAsync(Func<Task> operation)
        {
            await ExecuteWithRetryAsync(async () =>
            {
                await operation();
                return true;  // Dummy return value
            });
        }
    }
}
