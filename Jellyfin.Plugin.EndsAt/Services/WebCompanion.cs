using System.Reflection;

namespace Jellyfin.Plugin.EndsAt.Services;

/// <summary>Loads the client script embedded in this assembly.</summary>
internal static class WebCompanion
{
    internal static string Load(Plugin plugin)
    {
        Assembly assembly = typeof(WebCompanion).Assembly;
        using Stream stream = assembly.GetManifestResourceStream("Jellyfin.Plugin.EndsAt.Web.ends-at.js")
            ?? throw new InvalidOperationException("The Ends At web companion was not embedded.");
        using StreamReader reader = new(stream);
        return reader.ReadToEnd()
            .Replace("__SHOW_POSTER_BADGES__", plugin.Configuration.ShowPosterBadges.ToString().ToLowerInvariant(), StringComparison.Ordinal)
            .Replace("__INCLUDE_SERIES__", plugin.Configuration.IncludeSeries.ToString().ToLowerInvariant(), StringComparison.Ordinal)
            .Replace("__PLUGIN_VERSION__", plugin.Version.ToString(), StringComparison.Ordinal);
    }
}
