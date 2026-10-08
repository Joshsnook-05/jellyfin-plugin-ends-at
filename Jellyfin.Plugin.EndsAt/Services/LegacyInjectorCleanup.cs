using System.Reflection;
using System.Runtime.Loader;
using Microsoft.Extensions.Hosting;

namespace Jellyfin.Plugin.EndsAt.Services;

/// <summary>Removes the script registered by releases that used JavaScript Injector.</summary>
public sealed class LegacyInjectorCleanup : IHostedService
{
    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        Assembly? injector = AssemblyLoadContext.All
            .SelectMany(context => context.Assemblies)
            .FirstOrDefault(assembly => assembly.GetName().Name == "Jellyfin.Plugin.JavaScriptInjector");
        Type? pluginInterface = injector?.GetType("Jellyfin.Plugin.JavaScriptInjector.PluginInterface");
        MethodInfo? unregister = pluginInterface?.GetMethod("UnregisterAllScriptsFromPlugin", BindingFlags.Public | BindingFlags.Static);
        _ = unregister?.Invoke(null, [Plugin.PluginId.ToString()]);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
