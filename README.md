# Ends At for Jellyfin

**Ends At** helps pick something you can finish before a deadline. In Jellyfin Web it adds:

- an **Ends by** time filter, which hides titles that would finish after the selected local time;
- an optional **Ends @ HH:MM** badge inside movie and series posters; and
- the same treatment for series, using the median runtime of their available episodes.

The badge is enabled by default and can be disabled globally in the plugin settings or per browser from the floating control.

It is designed to work with the [Remote Library plugin](https://github.com/Joshsnook-05/jellyfin-remote-library): remote titles are evaluated through Jellyfin's normal item API, with no local-path requirement.

## Requirements

- Jellyfin Server **12.1.x**

Ends At injects its small, bundled web companion directly into Jellyfin Web at request time. It does not require JavaScript Injector, File Transformation, or edits to Jellyfin's files on disk.

## Installation

### Jellyfin repository (recommended)

1. In Jellyfin, open **Dashboard → Plugins → Repositories** and press **Add**.
2. Name it `Ends At` and use this repository URL:

   ```text
   https://raw.githubusercontent.com/Joshsnook-05/jellyfin-plugin-ends-at/master/manifest.json
   ```

3. Save, open the **Catalog** tab, choose **Ends At**, and select **Install**.
4. Restart Jellyfin when prompted, then hard-refresh Jellyfin Web.

The catalog always points to the tested release package, so it is the preferred install and update path.

### Direct download

Alternatively, download [`Jellyfin.Plugin.EndsAt_1.0.0.0.zip`](https://github.com/Joshsnook-05/jellyfin-plugin-ends-at/releases/download/v1.0.0/Jellyfin.Plugin.EndsAt_1.0.0.0.zip) from the [v1.0.0 release](https://github.com/Joshsnook-05/jellyfin-plugin-ends-at/releases/tag/v1.0.0), then install it through Jellyfin’s plugin dashboard.

## Setup

1. Install Ends At and restart Jellyfin.
2. Hard-refresh Jellyfin Web. The bundled companion loads automatically; no other plugin is required.
3. In a movie or series grid, use the floating **Ends by** time input. Titles that would end after that local time are hidden.
4. Use **Clear** to remove the current filter. The page immediately recalculates the `Ends @` badges from the current time.

## Configuration

Open **Dashboard → Plugins → Ends At** to configure server defaults:

| Option | Default | Effect |
| --- | --- | --- |
| Show “Ends @” badges | On | Shows the calculated local end time at the bottom of supported posters. Each browser can override this with the **Badges** checkbox. |
| Include TV series | On | Calculates a series estimate from the median runtime of its available episodes. |

Hard-refresh Jellyfin Web after changing settings so the browser receives the refreshed bundled companion.

## Remote Library compatibility

Ends At uses Jellyfin's authenticated item API, not filesystem paths or local-media assumptions. Consequently, items supplied by Remote Library work when they expose normal Jellyfin `RunTimeTicks` metadata. For series, the median is calculated from the remote episodes Jellyfin returns to that viewer. Missing runtimes are left unbadged rather than guessed.

## Notes

This is the first stable release, `1.0.0`. The companion targets Jellyfin Web's current card markup and is defensive, but client UI changes can require a companion update. The filter evaluates from the current time; a selected time earlier than now is interpreted as tomorrow.

## Development

```sh
dotnet build Jellyfin.Plugin.EndsAt.slnx
```

The project targets .NET 10 and Jellyfin 12.1.0. It is MIT licensed; see [LICENSE](LICENSE).
