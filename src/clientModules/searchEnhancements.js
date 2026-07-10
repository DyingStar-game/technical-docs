// Search UX tweaks for @easyops-cn/docusaurus-search-local, done WITHOUT swizzling (its SearchBar is
// unsafe to eject). Three behaviours:
//
// 1. Enter opens the full "See all results" page for the current query (not the highlighted item).
//    A capture-phase keydown listener beats autocomplete.js's own handler and clicks the "See all
//    results" link the plugin already renders, reusing its exact URL + SPA navigation.
//
// 2. In each result's breadcrumb (shown thanks to `explicitSearchResultPath`), tint the FIRST segment
//    — the root section (Network Game, Creative Concept, Project…) — a distinct colour, so every role
//    instantly spots which part of the docs a hit belongs to. The breadcrumb is plain "A › B › C"
//    text, so a MutationObserver wraps its first segment in a span we can style.
//
// 3. On the "/search" results page, inject a row of clickable section chips (one per root section
//    present in the current results). Clicking chips filters the list to those sections (multi-select,
//    OR) so each role can narrow the results to the part of the docs that concerns them.
//
// All three run from a single MutationObserver. We DISCONNECT it while we mutate and RECONNECT after,
// so our own DOM edits never re-trigger the observer (no infinite loop).
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
  // ── 1. Enter → "See all results" ──────────────────────────────────────────
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter') {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains('navbar__search-input')) {
        return;
      }
      const seeAll = document.querySelector('a[href*="search/?q="]');
      if (!seeAll) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      seeAll.click();
    },
    true, // capture phase: before autocomplete.js's bubble-phase Enter handler
  );

  // ── 2. Tint the root-section segment of each result's breadcrumb ────────────
  // The breadcrumb is plain "A › B › C" text (a single .hitPath span), so we wrap
  // its first segment in a span the site CSS (.ds-search-section, in custom.css)
  // styles. Styling lives in custom.css, not here, so it is themeable in one place.
  const SEP = ' › '; // the separator @easyops-cn/docusaurus-search-local joins the breadcrumb with

  // Breadcrumb elements to enhance: the navbar dropdown (.hitPath) AND the full
  // "/search" results page (.searchResultItemPath, a CSS-module-hashed class).
  const PATH_SELECTOR = [
    '.hitPath:not([data-ds-tinted])',
    '[class*="hitPath"]:not([data-ds-tinted])',
    '[class*="searchResultItemPath"]:not([data-ds-tinted])',
  ].join(', ');

  // Root section = the first breadcrumb segment (before the first " › "), or the whole
  // path when it has a single segment.
  const rootSectionOf = (text) => {
    const t = (text || '').trim();
    if (!t) {
      return '';
    }
    const idx = t.indexOf(SEP);
    return (idx < 0 ? t : t.slice(0, idx)).trim();
  };

  const tintBreadcrumbs = () => {
    document
      .querySelectorAll(PATH_SELECTOR)
      .forEach((el) => {
        el.setAttribute('data-ds-tinted', '1');
        const text = el.textContent || '';
        if (!text.trim()) {
          return;
        }
        const idx = text.indexOf(SEP);
        // Multi-segment "Section › Page › Heading": tint only the first segment.
        // Single-segment "Section" (a lone section/parent-page subtitle): the whole
        // path is the location context, so tint all of it.
        const section = idx < 0 ? text : text.slice(0, idx);
        const rest = idx < 0 ? '' : text.slice(idx); // keeps the leading separator
        const span = document.createElement('span');
        span.className = 'ds-search-section';
        span.textContent = section;
        el.textContent = '';
        el.appendChild(span);
        if (rest) {
          el.appendChild(document.createTextNode(rest));
        }
      });
  };

  // ── 3. Section filter chips on the /search results page ─────────────────────
  const selected = new Set(); // sections the user is filtering to (empty = show all)

  const sectionOfArticle = (article) => {
    const path = article.querySelector('[class*="searchResultItemPath"]');
    return path ? rootSectionOf(path.textContent) : '';
  };

  const applyFilter = (articles) => {
    articles.forEach((a) => {
      const s = sectionOfArticle(a);
      const show = selected.size === 0 || (s && selected.has(s));
      a.style.display = show ? '' : 'none';
    });
  };

  const enhanceSearchPage = () => {
    const articles = Array.from(
      document.querySelectorAll('article[class*="searchResultItem"]'),
    );
    const existing = document.getElementById('ds-search-filters');
    if (articles.length === 0) {
      if (existing) {
        existing.remove();
      }
      return;
    }
    const section = articles[0].closest('section') || articles[0].parentElement;
    if (!section || !section.parentElement) {
      return;
    }

    // Count results per root section (first-seen ⇒ sort alphabetically for a stable bar).
    const counts = new Map();
    articles.forEach((a) => {
      const s = sectionOfArticle(a);
      if (s) {
        counts.set(s, (counts.get(s) || 0) + 1);
      }
    });
    // Drop selections for sections no longer present, else the OR filter would hide everything.
    selected.forEach((s) => {
      if (!counts.has(s)) {
        selected.delete(s);
      }
    });

    let bar = existing;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ds-search-filters';
      bar.className = 'ds-filters';
      section.parentElement.insertBefore(bar, section);
    }
    bar.textContent = '';

    const label = document.createElement('span');
    label.className = 'ds-filters-label';
    label.textContent = 'Filter by section:';
    bar.appendChild(label);

    Array.from(counts.keys())
      .sort((a, b) => a.localeCompare(b))
      .forEach((name) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ds-filter-chip' + (selected.has(name) ? ' ds-filter-chip--on' : '');
        chip.textContent = name + ' ';
        const cnt = document.createElement('span');
        cnt.className = 'ds-filter-count';
        cnt.textContent = String(counts.get(name));
        chip.appendChild(cnt);
        chip.addEventListener('click', () => {
          if (selected.has(name)) {
            selected.delete(name);
          } else {
            selected.add(name);
          }
          chip.classList.toggle('ds-filter-chip--on');
          applyFilter(articles);
        });
        bar.appendChild(chip);
      });

    applyFilter(articles);
  };

  // Single observer for all three enhancements. Coalesce bursts with rAF and disconnect
  // while we mutate so our own edits never feed back into the observer.
  let scheduled = false;
  let observer;
  const run = () => {
    scheduled = false;
    observer.disconnect();
    try {
      tintBreadcrumbs();
      enhanceSearchPage();
    } finally {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };
  observer = new MutationObserver(() => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(run);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  run(); // initial pass (e.g. landing straight on /search?q=…)
}
