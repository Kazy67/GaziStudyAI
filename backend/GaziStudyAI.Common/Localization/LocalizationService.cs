using GaziStudyAI.Common.Resources;
using Microsoft.Extensions.Localization;

namespace GaziStudyAI.Common.Localization
{
    public class LocalizationService : ILocalizationService
    {
        private readonly IStringLocalizer<Resource> _localizer;

        public LocalizationService(IStringLocalizer<Resource> localizer)
        {
            _localizer = localizer;
        }

        public string GetString(string key)
        {
            return _localizer[key];
        }

        public string GetString(string key, params object[] args)
        {
            return _localizer[key, args];
        }
    }
}
