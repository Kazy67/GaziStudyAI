using Microsoft.AspNetCore.Http;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IFileService
    {
        Task<string> UploadProfileImageAsync(IFormFile file);
        void DeleteFile(string relativeFilePath);
        Task<string> UploadCourseImageAsync(IFormFile file);
    }
}
