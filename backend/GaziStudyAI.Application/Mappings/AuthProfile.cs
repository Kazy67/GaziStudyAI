using AutoMapper;
using GaziStudyAI.Application.DTOs.Auth;
using GaziStudyAI.Domain.Entities.Auth;
using GaziStudyAI.Domain.Enums;

namespace GaziStudyAI.Application.Mappings
{
    public class AuthProfile : Profile
    {
        public AuthProfile()
        {
            // Map RegisterDto -> User (Ignore PasswordHash, we set it manually)
            CreateMap<RegisterDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordSalt, opt => opt.Ignore())
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => UserRole.Student))
                .ForMember(dest => dest.IsEmailVerified, opt => opt.MapFrom(src => false));

            // Map User -> AuthResponseDto
            CreateMap<User, AuthResponseDto>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()))
                .ForMember(dest => dest.IsVerified, opt => opt.MapFrom(src => src.IsEmailVerified));
        }
    }
}
