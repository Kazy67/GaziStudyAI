namespace GaziStudyAI.Common.Result.Abstract
{
    public interface IResult
    {
        bool IsSuccess { get; }
        string Message { get; }
        string? MessageCode { get; }
        List<string>? Errors { get; }
    }

    public interface IResult<out T> : IResult
    {
        T? Data { get; }
    }
}
