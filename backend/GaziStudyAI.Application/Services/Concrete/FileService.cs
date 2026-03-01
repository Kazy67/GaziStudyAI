using GaziStudyAI.Application.Services.Abstract;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _env;

        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }
        public async Task<string> UploadProfileImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            // THE FIX: If WebRootPath is null (folder missing), fallback to ContentRootPath/wwwroot
            var rootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsFolder = Path.Combine(rootPath, "uploads", "profiles");

            // If the inner folders don't exist, create them automatically
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var extension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/profiles/{uniqueFileName}";
        }

        public void DeleteFile(string relativeFilePath)
        {
            if (string.IsNullOrEmpty(relativeFilePath)) return;

            var rootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");

            // 2. The database stores "/uploads/profiles/xyz.png". 
            // We must remove the first slash, otherwise Path.Combine gets confused on Windows!
            var cleanRelativePath = relativeFilePath.TrimStart('/', '\\');

            // 3. Combine them to get the exact location on the hard drive
            var physicalPath = Path.Combine(rootPath, cleanRelativePath);

            // 4. Delete it if it exists
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }
        }

        public async Task<string> UploadCourseImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");
            var rootPath = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsFolder = Path.Combine(rootPath, "uploads", "courses");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var extension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/courses/{uniqueFileName}";
        }
    }
}
