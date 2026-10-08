using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.EndsAt.Configuration;

/// <summary>Configuration shared by the optional web companion.</summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>Gets or sets a value indicating whether poster badges are shown.</summary>
    public bool ShowPosterBadges { get; set; } = true;

    /// <summary>Gets or sets a value indicating whether series use the median episode duration.</summary>
    public bool IncludeSeries { get; set; } = true;
}
