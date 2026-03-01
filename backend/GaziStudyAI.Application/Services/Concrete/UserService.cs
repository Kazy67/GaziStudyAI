using AutoMapper;
using FluentValidation;
using GaziStudyAI.Application.DTOs.User;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileService _fileService;
        private readonly IMapper _mapper;
        private readonly IValidator<UpdateProfileDto> _validator;

        public UserService(
            IUnitOfWork uow,
            IFileService fileService,
            IMapper mapper,
            IValidator<UpdateProfileDto> validator)
        {
            _uow = uow;
            _fileService = fileService;
            _mapper = mapper;
            _validator = validator;
        }

        public async Task<IResult> UpdateProfileAsync(Guid userId, UpdateProfileDto request)
        {
            // 1. VALIDATION
            var validationResult = await _validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return ServiceResult.Failure("Validation failed", "VALIDATION_FAILED", errors);
            }

            // 2. FETCH USER
            var user = await _uow.UserRepository.GetByIdAsync(userId);
            if (user == null)
                return ServiceResult.Failure("User not found.", "USER_NOT_FOUND");

            // 3. AUTOMAPPER: Maps FirstName, LastName, StudentNumber, Department automatically!
            _mapper.Map(request, user);

            if (request.RemoveExistingImage)
            {
                if (!string.IsNullOrEmpty(user.ProfileImageUrl))
                {
                    _fileService.DeleteFile(user.ProfileImageUrl); // Delete from hard drive
                }
                user.ProfileImageUrl = null; // Clear from database
            }
            // Scenario 2: User uploaded a NEW avatar
            else if (request.ProfileImage != null && request.ProfileImage.Length > 0)
            {
                // Delete the OLD one first to save disk space!
                if (!string.IsNullOrEmpty(user.ProfileImageUrl))
                {
                    _fileService.DeleteFile(user.ProfileImageUrl);
                }

                // Upload the NEW one
                var imageUrl = await _fileService.UploadProfileImageAsync(request.ProfileImage);
                user.ProfileImageUrl = imageUrl;
            }

            // 5. SAVE
            _uow.UserRepository.Update(user);
            await _uow.SaveChangesAsync();

            return ServiceResult.Success("Profile updated successfully.", "PROFILE_UPDATED");
        }

        public async Task<IResult<UserProfileDto>> GetProfileAsync(Guid userId)
        {
            var user = await _uow.UserRepository.GetByIdAsync(userId);

            if (user == null)
                return ServiceResult<UserProfileDto>.Failure("User not found.", "USER_NOT_FOUND");

            // AutoMapper converts the User entity to UserProfileDto
            var profileDto = _mapper.Map<UserProfileDto>(user);

            return ServiceResult<UserProfileDto>.Success(profileDto, "Profile fetched successfully.", "PROFILE_FETCHED");
        }
    }
}
