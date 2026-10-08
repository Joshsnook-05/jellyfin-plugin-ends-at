using Jellyfin.Plugin.EndsAt.Services;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin.Plugin.EndsAt;

/// <summary>Registers plugin services with Jellyfin.</summary>
public sealed class ServiceRegistrator : IPluginServiceRegistrator
{
    /// <inheritdoc />
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        serviceCollection.AddHostedService<JavaScriptInjectorBridge>();
    }
}
