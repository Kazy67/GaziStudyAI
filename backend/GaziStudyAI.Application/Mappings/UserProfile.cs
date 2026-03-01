using AutoMapper;
using GaziStudyAI.Application.DTOs.User;
using GaziStudyAI.Domain.Entities.Auth;

namespace GaziStudyAI.Application.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            // Map DTO -> User (For Updates)
            CreateMap<UpdateProfileDto, User>()
                .ForMember(dest => dest.ProfileImageUrl, opt => opt.Ignore()); // Ignore the file upload
            CreateMap<User, UserProfileDto>();
        }
    }
}
