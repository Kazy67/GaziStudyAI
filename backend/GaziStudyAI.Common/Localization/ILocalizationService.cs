namespace GaziStudyAI.Common.Localization
{
    public interface ILocalizationService
    {
        string GetString(string key);
        string GetString(string key, params object[] args);
    }
}
