using System.Reflection;

namespace Jellyfin.Plugin.EndsAt.Services;

/// <summary>Loads the client script embedded in this assembly.</summary>
internal static class WebCompanion
{
    internal static string Load(Plugin plugin)
    {
        Assembly assembly = typeof(WebCompanion).Assembly;
        string script = ReadResource(assembly, "Jellyfin.Plugin.EndsAt.Web.ends-at.js");
        string translations = ReadResource(assembly, "Jellyfin.Plugin.EndsAt.Web.translations.json");
        return script
            .Replace("__SHOW_POSTER_BADGES__", plugin.Configuration.ShowPosterBadges.ToString().ToLowerInvariant(), StringComparison.Ordinal)
            .Replace("__INCLUDE_SERIES__", plugin.Configuration.IncludeSeries.ToString().ToLowerInvariant(), StringComparison.Ordinal)
            .Replace("__TIME_FORMAT__", plugin.Configuration.TimeFormat.ToString(), StringComparison.Ordinal)
            .Replace("__TRANSLATIONS__", translations, StringComparison.Ordinal)
            .Replace("__PLUGIN_VERSION__", plugin.Version.ToString(), StringComparison.Ordinal);
    }

    private static string ReadResource(Assembly assembly, string name)
    {
        using Stream stream = assembly.GetManifestResourceStream(name)
            ?? throw new InvalidOperationException($"The Ends At resource {name} was not embedded.");
        using StreamReader reader = new(stream);
        return reader.ReadToEnd();
    }
}
