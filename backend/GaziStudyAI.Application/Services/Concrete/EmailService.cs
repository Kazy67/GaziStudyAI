using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;
using System.Net;
using System.Net.Mail;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class EmailService : IEmailService
    {
        private readonly IUnitOfWork _uow;

        public EmailService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<IResult> SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                // 1. Get Config using the Repository
                // We use the GetAsync method from your GenericRepository
                var config = await _uow.EmailConfigurationRepository.GetAsync(x => x.IsActive);

                if (config == null)
                    return ServiceResult.Failure("Email configuration not found.");

                // 2. Setup SMTP Client
                using var client = new SmtpClient(config.SmtpServer, config.Port)
                {
                    Credentials = new NetworkCredential(config.SenderEmail, config.SenderPassword),
                    EnableSsl = config.EnableSsl
                };

                // 3. Create Message
                var mailMessage = new MailMessage
                {
                    From = new MailAddress(config.SenderEmail, "GaziStudyAI"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(to);

                // 4. Send
                await client.SendMailAsync(mailMessage);
                return ServiceResult.Success("Email sent.");
            }
            catch (Exception ex)
            {
                return ServiceResult.Failure($"Email failed: {ex.Message}");
            }
        }
    }
}
