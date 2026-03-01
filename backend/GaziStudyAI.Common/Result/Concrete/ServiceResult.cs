using GaziStudyAI.Common.Result.Abstract;
using System.Text.Json.Serialization;

namespace GaziStudyAI.Common.Result.Concrete
{
    public class ServiceResult<T> : IResult<T>
    {
        public T? Data { get; set; }
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? MessageCode { get; set; }
        public List<string>? Errors { get; set; }

        // Empty constructor for JSON Deserialization (Crucial for AI Service)
        [JsonConstructor]
        public ServiceResult() { }

        // ✅ Success Factory
        public static ServiceResult<T> Success(T data, string message = "Success", string? messageCode = null)
        {
            return new ServiceResult<T>
            {
                IsSuccess = true,
                Data = data,
                Message = message,
                MessageCode = messageCode,
                Errors = null
            };
        }

        public static ServiceResult<T> Failure(string errorMessage, string? messageCode = null, List<string>? errors = null)
        {
            return new ServiceResult<T>
            {
                IsSuccess = false,
                Data = default,
                Message = errorMessage,
                MessageCode = messageCode,
                Errors = errors ?? new List<string> { errorMessage }
            };
        }
    }

    public class ServiceResult : IResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? MessageCode { get; set; }
        public List<string>? Errors { get; set; }

        [JsonConstructor]
        public ServiceResult() { }

        // Success Factory (No Data argument)
        public static ServiceResult Success(string message = "Success", string? messageCode = null)
        {
            return new ServiceResult
            {
                IsSuccess = true,
                Message = message,
                MessageCode = messageCode,
                Errors = null
            };
        }

        public static ServiceResult Failure(string errorMessage, string? messageCode = null, List<string>? errors = null)
        {
            return new ServiceResult
            {
                IsSuccess = false,
                Message = errorMessage,
                MessageCode = messageCode,
                Errors = errors ?? new List<string> { errorMessage }
            };
        }
    }
}
