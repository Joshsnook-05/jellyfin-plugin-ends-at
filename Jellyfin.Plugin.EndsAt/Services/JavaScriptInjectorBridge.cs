using System.Reflection;
using System.Runtime.Loader;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Linq;

namespace Jellyfin.Plugin.EndsAt.Services;

/// <summary>Registers the web companion when JavaScript Injector is available.</summary>
public sealed class JavaScriptInjectorBridge : IHostedService
{
    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        Assembly? injector = AssemblyLoadContext.All
            .SelectMany(context => context.Assemblies)
            .FirstOrDefault(assembly => assembly.GetName().Name == "Jellyfin.Plugin.JavaScriptInjector");
        Type? pluginInterface = injector?.GetType("Jellyfin.Plugin.JavaScriptInjector.PluginInterface");
        MethodInfo? register = pluginInterface?.GetMethod("RegisterScript", BindingFlags.Public | BindingFlags.Static);
        Plugin? plugin = Plugin.Instance;

        if (register is not null && plugin is not null)
        {
            JObject registration = new()
            {
                ["id"] = $"{plugin.Id}-web-companion",
                ["name"] = "Ends At",
                ["script"] = WebCompanion.Load(plugin),
                ["enabled"] = true,
                ["requiresAuthentication"] = true,
                ["pluginId"] = plugin.Id.ToString(),
                ["pluginName"] = plugin.Name,
                ["pluginVersion"] = plugin.Version.ToString()
            };
            _ = register.Invoke(null, [registration]);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
