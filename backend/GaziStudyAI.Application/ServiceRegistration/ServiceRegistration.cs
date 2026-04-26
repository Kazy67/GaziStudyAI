using FluentValidation;
using GaziStudyAI.Application.Mappings;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Application.Services.Concrete;
using GaziStudyAI.Application.Validators;
using GaziStudyAI.Infrastructure.Repositories.Abstract;
using GaziStudyAI.Infrastructure.Repositories.Concrete;
using GaziStudyAI.Infrastructure.Services;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;
using GaziStudyAI.Infrastructure.UnitOfWork.Concrete;
using Microsoft.Extensions.DependencyInjection;

namespace GaziStudyAI.Application.ServiceRegistration
{
    public static class ServiceRegistration
    {
        public static void AddApplicationServices(this IServiceCollection services)
        {
            services.AddAutoMapper(typeof(AuthProfile).Assembly);

            // 2. FluentValidation
            services.AddValidatorsFromAssembly(typeof(ValidatorsAssemblyMarker).Assembly);

            // 3. Infrastructure (Repositories & UoW)
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // 4. Services
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IFileService, FileService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ICourseService, CourseService>();
            services.AddScoped<IAITestService, AITestService>();
            services.AddScoped<IAIExamService, AIExamService>();
            services.AddScoped<IAdminService, AdminService>();

            services.AddSingleton<ISystemLoggerService, SystemLogService>();
        }
    }
}
