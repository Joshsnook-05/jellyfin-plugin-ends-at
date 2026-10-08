/* Ends At web companion v__PLUGIN_VERSION__. */
(function () {
    'use strict';

    if (window.__endsAtLoaded) return;
    window.__endsAtLoaded = true;

    var defaults = { badges: __SHOW_POSTER_BADGES__, series: __INCLUDE_SERIES__, timeFormat: '__TIME_FORMAT__' };
    var cache = new Map();
    var busy = false;
    var style = document.createElement('style');
    style.textContent = [
        '.card .ends-at-badge{position:absolute;z-index:30;bottom:.55rem;left:.55rem;display:inline-flex;align-items:center;max-width:calc(100% - 1.1rem);padding:.3rem .55rem;border:1px solid rgba(255,255,255,.22);border-radius:999px;color:#fff;background:rgba(9,20,31,.88);box-shadow:0 2px 8px rgba(0,0,0,.38);font-size:.72rem;font-weight:700;letter-spacing:.06em;line-height:1;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}',
        '.ends-at-tools{position:fixed;right:1em;bottom:1em;z-index:1000;display:flex;align-items:center;gap:.45em;background:#202020eF;color:#fff;padding:.65em;border-radius:.5em;box-shadow:0 2px 12px #0008;font-size:.9em}',
        '.ends-at-tools input{color:#fff;background:#333;border:1px solid #666;border-radius:.2em;padding:.25em}',
        '.ends-at-tools button{color:#fff;background:#008cba;border:0;border-radius:.2em;padding:.35em .55em;cursor:pointer}',
        '.ends-at-rewatch{display:inline-flex;align-items:center;justify-content:center;min-width:2.35em;min-height:2.35em;margin:.4em;color:#fff;background:rgba(9,20,31,.88);border:1px solid rgba(255,255,255,.22);border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.38);font-size:1.1em;cursor:pointer}',
        '.ends-at-hidden{display:none !important}'
    ].join('');
    document.head.appendChild(style);

    function userId() {
        return window.ApiClient && typeof ApiClient.getCurrentUserId === 'function' ? ApiClient.getCurrentUserId() : null;
    }

    function formatTime(date) {
        var options = { hour: '2-digit', minute: '2-digit' };
        if (defaults.timeFormat === 'TwelveHour') options.hour12 = true;
        if (defaults.timeFormat === 'TwentyFourHour') options.hour12 = false;
        return date.toLocaleTimeString([], options);
    }

    function formatEnd(durationTicks) {
        var end = new Date(Date.now() + Number(durationTicks) / 10000);
        return 'Ends @ ' + formatTime(end);
    }

    function formatDuration(durationTicks) {
        var minutes = Math.max(0, Math.round(Number(durationTicks) / 600000000));
        var hours = Math.floor(minutes / 60);
        return hours ? hours + 'h ' + (minutes % 60) + 'm' : minutes + 'm';
    }

    function timingFor(item) {
        var total = Number(item.RunTimeTicks || 0);
        if (!total) return null;
        var userData = item.UserData || {};
        var position = Math.min(total, Math.max(0, Number(userData.PlaybackPositionTicks || 0)));
        var resumed = position > 0 && position < total;
        return { total: total, position: position, remaining: resumed ? total - position : total, resumed: resumed };
    }

    function median(values) {
        values.sort(function (a, b) { return a - b; });
        var middle = Math.floor(values.length / 2);
        return values.length % 2 ? values[middle] : Math.round((values[middle - 1] + values[middle]) / 2);
    }

    function getItems(options) {
        var id = userId();
        if (!id || !window.ApiClient || typeof ApiClient.getItems !== 'function') return Promise.resolve([]);
        return ApiClient.getItems(id, options).then(function (result) { return result.Items || []; });
    }

    function durationFor(item) {
        if (item.RunTimeTicks) return Promise.resolve(timingFor(item));
        if (!defaults.series || item.Type !== 'Series') return Promise.resolve(null);
        return getItems({ ParentId: item.Id, Recursive: true, IncludeItemTypes: 'Episode', Fields: 'RunTimeTicks', Limit: 500, EnableTotalRecordCount: false })
            .then(function (episodes) {
                var runtimes = episodes.map(function (episode) { return Number(episode.RunTimeTicks || 0); }).filter(Boolean);
                return runtimes.length ? { total: median(runtimes), position: 0, remaining: median(runtimes), resumed: false } : null;
            });
    }

    function loadMissing(ids) {
        var unknown = ids.filter(function (id) { return !cache.has(id); });
        if (!unknown.length) return Promise.resolve();
        return getItems({ Ids: unknown.join(','), Fields: 'RunTimeTicks,ChildCount,UserData', EnableTotalRecordCount: false })
            .then(function (items) {
                return Promise.all(items.map(function (item) {
                    return durationFor(item).then(function (duration) { cache.set(item.Id, duration); });
                }));
            });
    }

    function cards() {
        return Array.prototype.slice.call(document.querySelectorAll('.card[data-id]'));
    }

    function isLibraryBrowsePage() {
        var route = (window.location.hash || window.location.pathname || '').toLowerCase();
        return /(?:movies|tv|library|folder|search)(?:\.html)?(?:[?&/]|$)/.test(route);
    }

    function clearFilterControls() {
        var tools = document.querySelector('#ends-at-tools');
        if (tools) tools.remove();
        document.querySelectorAll('.ends-at-hidden').forEach(function (card) { card.classList.remove('ends-at-hidden'); });
    }

    function badgeHost(card) {
        return card.querySelector('.cardScalable') || card.querySelector('.cardBox') || card;
    }

    function applyBadges() {
        var enabled = localStorage.getItem('ends-at-badges');
        enabled = enabled === null ? defaults.badges : enabled === 'true';
        cards().forEach(function (card) {
            var id = card.dataset.id;
            var timing = cache.get(id);
            var badge = card.querySelector('.ends-at-badge');
            if (!enabled || !timing) { if (badge) badge.remove(); return; }
            if (!badge) { badge = document.createElement('span'); badge.className = 'ends-at-badge'; badgeHost(card).appendChild(badge); }
            badge.textContent = formatEnd(timing.remaining) + (timing.resumed ? ' · ' + formatDuration(timing.remaining) + ' left' : '');
            badge.title = timing.resumed
                ? formatDuration(timing.remaining) + ' remaining. From the beginning: ' + formatEnd(timing.total) + '. Watched: ' + formatDuration(timing.position) + ' of ' + formatDuration(timing.total) + '.'
                : 'From the beginning: ' + formatDuration(timing.total) + '.';
        });
    }

    function applyFilter() {
        var input = document.querySelector('#ends-at-time');
        if (!input || !input.value) return;
        var target = new Date();
        var parts = input.value.split(':');
        target.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
        if (target.getTime() < Date.now()) target.setDate(target.getDate() + 1);
        cards().forEach(function (card) {
            var timing = cache.get(card.dataset.id);
            card.classList.toggle('ends-at-hidden', Boolean(timing && Date.now() + timing.remaining / 10000 > target.getTime()));
        });
    }

    function ensureTools() {
        if (document.querySelector('#ends-at-tools')) return;
        var tools = document.createElement('div');
        tools.id = 'ends-at-tools';
        tools.className = 'ends-at-tools';
        tools.innerHTML = '<label>Ends by <input id="ends-at-time" type="time"></label><button type="button" id="ends-at-clear">Clear</button><label title="Toggle poster badges"><input id="ends-at-badges" type="checkbox"> Badges</label>';
        document.body.appendChild(tools);
        var badges = tools.querySelector('#ends-at-badges');
        var saved = localStorage.getItem('ends-at-badges');
        badges.checked = saved === null ? defaults.badges : saved === 'true';
        badges.addEventListener('change', function () { localStorage.setItem('ends-at-badges', badges.checked); applyBadges(); });
        tools.querySelector('#ends-at-time').addEventListener('change', applyFilter);
        tools.querySelector('#ends-at-clear').addEventListener('click', function () { tools.querySelector('#ends-at-time').value = ''; cards().forEach(function (card) { card.classList.remove('ends-at-hidden'); }); });
    }

    function detailItemId() {
        var match = (window.location.hash || '').match(/[?&]id=([^&#]+)/i);
        return match ? decodeURIComponent(match[1]) : null;
    }

    function isDetailPage() {
        return /(?:^|[/#])details(?:\.html)?(?:[?&/]|$)/i.test(window.location.hash || '') && Boolean(detailItemId());
    }

    function markUnplayed(itemId) {
        var id = userId();
        if (!id || !window.ApiClient) return Promise.reject(new Error('No signed-in Jellyfin user.'));
        if (typeof ApiClient.markUnplayedItem === 'function') return ApiClient.markUnplayedItem(id, itemId);
        return ApiClient.ajax({ type: 'DELETE', url: ApiClient.getUrl('Users/' + encodeURIComponent(id) + '/PlayedItems/' + encodeURIComponent(itemId)) });
    }

    function resetForRewatch(itemId) {
        var id = userId();
        if (!id || !ApiClient || typeof ApiClient.getItem !== 'function') return Promise.reject(new Error('Jellyfin item API is unavailable.'));
        return ApiClient.getItem(id, itemId).then(function (item) {
            var recursive = item.Type === 'Series' || item.Type === 'Season' || item.Type === 'BoxSet';
            if (!recursive) return [item.Id];
            var label = item.Type === 'Series' ? 'all episodes in this series' : item.Type === 'Season' ? 'all episodes in this season' : 'all eligible items in this collection';
            if (!window.confirm('Reset watch progress for ' + label + '?')) return null;
            return getItems({ ParentId: item.Id, Recursive: true, IncludeItemTypes: 'Movie,Episode', Fields: 'UserData', Limit: 10000, EnableTotalRecordCount: false }).then(function (items) { return [item.Id].concat(items.map(function (child) { return child.Id; })); });
        }).then(function (ids) {
            if (!ids) return false;
            return Promise.all(ids.map(function (id) { cache.delete(id); return markUnplayed(id); })).then(function () { return true; });
        });
    }

    function showToast(message) {
        if (window.Dashboard && typeof Dashboard.alert === 'function') Dashboard.alert(message);
        else window.alert(message);
    }

    function syncRewatchControl() {
        var existing = document.querySelector('#ends-at-rewatch');
        if (!isDetailPage()) { if (existing) existing.remove(); return; }
        var itemId = detailItemId();
        if (existing && existing.dataset.itemId === itemId) return;
        if (existing) existing.remove();
        var host = document.querySelector('.detailPagePrimaryContainer') || document.querySelector('.itemDetailPage');
        if (!host) return;
        var button = document.createElement('button');
        button.id = 'ends-at-rewatch';
        button.className = 'ends-at-rewatch';
        button.dataset.itemId = itemId;
        button.type = 'button';
        button.title = 'Rewatch';
        button.setAttribute('aria-label', 'Rewatch');
        button.textContent = '↶';
        button.addEventListener('click', function () {
            button.disabled = true;
            resetForRewatch(itemId).then(function (changed) { if (changed) { showToast('Marked as unwatched.'); refresh(); } }).catch(function () { showToast('Could not reset watch progress.'); }).finally(function () { button.disabled = false; });
        });
        host.appendChild(button);
    }

    function refresh() {
        syncRewatchControl();
        if (busy || !cards().length) return;
        var showFilter = isLibraryBrowsePage();
        if (!showFilter) clearFilterControls();
        busy = true;
        var ids = cards().map(function (card) { return card.dataset.id; }).filter(Boolean);
        loadMissing(ids).then(function () {
            applyBadges();
            if (showFilter) {
                ensureTools();
                applyFilter();
            }
        }).finally(function () { busy = false; });
    }

    new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
    window.setInterval(refresh, 1200);
    refresh();
}());
