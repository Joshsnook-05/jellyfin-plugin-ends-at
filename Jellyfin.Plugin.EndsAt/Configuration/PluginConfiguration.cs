using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.EndsAt.Configuration;

/// <summary>Controls the clock used for Ends At times.</summary>
public enum TimeFormat
{
    /// <summary>Follow the browser locale.</summary>
    Automatic,

    /// <summary>Use a 12-hour clock with AM/PM.</summary>
    TwelveHour,

    /// <summary>Use a 24-hour clock.</summary>
    TwentyFourHour
}

/// <summary>Configuration shared by the optional web companion.</summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>Gets or sets a value indicating whether poster badges are shown.</summary>
    public bool ShowPosterBadges { get; set; } = true;

    /// <summary>Gets or sets a value indicating whether series use the median episode duration.</summary>
    public bool IncludeSeries { get; set; } = true;

    /// <summary>Gets or sets the time format used by Ends At badges.</summary>
    public TimeFormat TimeFormat { get; set; } = TimeFormat.Automatic;
}
