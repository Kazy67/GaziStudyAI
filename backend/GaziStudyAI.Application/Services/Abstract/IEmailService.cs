using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IEmailService
    {
        Task<IResult> SendEmailAsync(string to, string subject, string body);
    }
}
