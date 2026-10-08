using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.EndsAt.Services;

/// <summary>Injects the Ends At companion into Jellyfin Web without external plugins.</summary>
public sealed class WebCompanionStartupFilter : IStartupFilter
{
    private const string Marker = "<!-- Ends At web companion -->";
    private readonly ILogger<WebCompanionStartupFilter> _logger;

    /// <summary>Initializes a new instance of the <see cref="WebCompanionStartupFilter"/> class.</summary>
    public WebCompanionStartupFilter(ILogger<WebCompanionStartupFilter> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.Use(InjectCompanionAsync);
            next(app);
        };
    }

    private async Task InjectCompanionAsync(HttpContext context, Func<Task> next)
    {
        if (!IsWebIndexRequest(context.Request.Path.Value) || !HttpMethods.IsGet(context.Request.Method))
        {
            await next().ConfigureAwait(false);
            return;
        }

        context.Request.Headers.Remove("Accept-Encoding");
        context.Request.Headers.Remove("Range");
        context.Request.Headers.Remove("If-Range");

        Stream originalBody = context.Response.Body;
        await using MemoryStream buffer = new();
        context.Response.Body = buffer;

        try
        {
            await next().ConfigureAwait(false);
        }
        catch
        {
            context.Response.Body = originalBody;
            throw;
        }

        context.Response.Body = originalBody;
        buffer.Position = 0;
        bool isHtml = context.Response.StatusCode == StatusCodes.Status200OK
            && (context.Response.ContentType?.Contains("text/html", StringComparison.OrdinalIgnoreCase) ?? false);

        if (!isHtml)
        {
            await buffer.CopyToAsync(originalBody).ConfigureAwait(false);
            return;
        }

        using StreamReader reader = new(buffer, Encoding.UTF8, true, 1024, leaveOpen: true);
        string html = await reader.ReadToEndAsync().ConfigureAwait(false);
        string? injected = BuildInjectionBlock();
        int bodyClose = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);

        if (injected is not null && !html.Contains(Marker, StringComparison.Ordinal) && bodyClose >= 0)
        {
            html = html[..bodyClose] + injected + "\n" + html[bodyClose..];
        }

        byte[] bytes = Encoding.UTF8.GetBytes(html);
        context.Response.ContentType = "text/html; charset=utf-8";
        context.Response.ContentLength = bytes.Length;
        context.Response.Headers.Remove("ETag");
        context.Response.Headers.Remove("Last-Modified");
        context.Response.Headers.Remove("Accept-Ranges");
        await originalBody.WriteAsync(bytes).ConfigureAwait(false);
    }

    private string? BuildInjectionBlock()
    {
        try
        {
            Plugin? plugin = Plugin.Instance;
            return plugin is null ? null : string.Concat(Marker, "<script>", WebCompanion.Load(plugin), "</script>");
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not load the Ends At web companion.");
            return null;
        }
    }

    private static bool IsWebIndexRequest(string? path)
    {
        return !string.IsNullOrEmpty(path)
            && (path.EndsWith("/web/index.html", StringComparison.OrdinalIgnoreCase)
                || path.EndsWith("/web/", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/web", StringComparison.OrdinalIgnoreCase));
    }
}
