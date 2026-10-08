/* Ends At web companion v__PLUGIN_VERSION__. Loaded by JavaScript Injector. */
(function () {
    'use strict';

    if (window.__endsAtLoaded) return;
    window.__endsAtLoaded = true;

    var defaults = { badges: __SHOW_POSTER_BADGES__, series: __INCLUDE_SERIES__ };
    var cache = new Map();
    var busy = false;
    var style = document.createElement('style');
    style.textContent = [
        '.ends-at-badge{position:absolute;bottom:.35em;left:.35em;right:.35em;z-index:3;background:rgba(0,0,0,.82);color:#fff;border-radius:.25em;padding:.28em .35em;font-size:.78em;font-weight:600;text-align:center;pointer-events:none;text-shadow:0 1px 2px #000}',
        '.ends-at-tools{position:fixed;right:1em;bottom:1em;z-index:1000;display:flex;align-items:center;gap:.45em;background:#202020eF;color:#fff;padding:.65em;border-radius:.5em;box-shadow:0 2px 12px #0008;font-size:.9em}',
        '.ends-at-tools input{color:#fff;background:#333;border:1px solid #666;border-radius:.2em;padding:.25em}',
        '.ends-at-tools button{color:#fff;background:#008cba;border:0;border-radius:.2em;padding:.35em .55em;cursor:pointer}',
        '.ends-at-hidden{display:none !important}'
    ].join('');
    document.head.appendChild(style);

    function userId() {
        return window.ApiClient && typeof ApiClient.getCurrentUserId === 'function' ? ApiClient.getCurrentUserId() : null;
    }

    function formatEnd(durationTicks) {
        var end = new Date(Date.now() + Number(durationTicks) / 10000);
        return 'Ends @ ' + end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        if (item.RunTimeTicks) return Promise.resolve(Number(item.RunTimeTicks));
        if (!defaults.series || item.Type !== 'Series') return Promise.resolve(null);
        return getItems({ ParentId: item.Id, Recursive: true, IncludeItemTypes: 'Episode', Fields: 'RunTimeTicks', Limit: 500, EnableTotalRecordCount: false })
            .then(function (episodes) {
                var runtimes = episodes.map(function (episode) { return Number(episode.RunTimeTicks || 0); }).filter(Boolean);
                return runtimes.length ? median(runtimes) : null;
            });
    }

    function loadMissing(ids) {
        var unknown = ids.filter(function (id) { return !cache.has(id); });
        if (!unknown.length) return Promise.resolve();
        return getItems({ Ids: unknown.join(','), Fields: 'RunTimeTicks,ChildCount', EnableTotalRecordCount: false })
            .then(function (items) {
                return Promise.all(items.map(function (item) {
                    return durationFor(item).then(function (duration) { cache.set(item.Id, duration); });
                }));
            });
    }

    function cards() {
        return Array.prototype.slice.call(document.querySelectorAll('.card[data-id]'));
    }

    function applyBadges() {
        var enabled = localStorage.getItem('ends-at-badges');
        enabled = enabled === null ? defaults.badges : enabled === 'true';
        cards().forEach(function (card) {
            var id = card.dataset.id;
            var duration = cache.get(id);
            var badge = card.querySelector('.ends-at-badge');
            if (!enabled || !duration) { if (badge) badge.remove(); return; }
            if (!badge) { badge = document.createElement('span'); badge.className = 'ends-at-badge'; card.style.position = 'relative'; card.appendChild(badge); }
            badge.textContent = formatEnd(duration);
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
            var duration = cache.get(card.dataset.id);
            card.classList.toggle('ends-at-hidden', Boolean(duration && Date.now() + duration / 10000 > target.getTime()));
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

    function refresh() {
        if (busy || !cards().length) return;
        busy = true;
        var ids = cards().map(function (card) { return card.dataset.id; }).filter(Boolean);
        loadMissing(ids).then(function () { ensureTools(); applyBadges(); applyFilter(); }).finally(function () { busy = false; });
    }

    new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
    window.setInterval(refresh, 1200);
    refresh();
}());
