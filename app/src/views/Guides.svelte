<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Info from '@lucide/svelte/icons/info';
  import Printer from '@lucide/svelte/icons/printer';
  import Search from '@lucide/svelte/icons/search';
  import { loadGuides } from 'virtual:guides';
  import { guideLang, searchGuides, type Guide, type GuideLang, type GuideLibrary, type GuideTheme } from '../lib/guides/library';
  import { i18n, t, tn } from '../lib/i18n/index.svelte';
  import { router } from '../lib/ui/state.svelte';
  import ThemeIcon from '../lib/ui/ThemeIcon.svelte';

  // The guides are the Markdown files of the repository's guides/ folder, rendered at build time
  // and loaded one language at a time.
  let libraries = $state.raw<Partial<Record<GuideLang, GuideLibrary>>>({});
  let query = $state('');

  // The table of contents follows the app language, in English when the guides do not exist in it.
  // An open guide is shown in its own language, so the link to its other-language version works
  // whatever the app language.
  const lang = $derived.by<GuideLang>(() => {
    const own = guideLang(router.path.split('/')[0]);
    return router.path.startsWith(`${own}/`) ? own : guideLang(i18n.lang);
  });
  const library = $derived(libraries[lang]);

  $effect(() => {
    const wanted = lang;
    if (libraries[wanted]) return;
    void loadGuides(wanted).then((loaded) => {
      libraries = { ...libraries, [wanted]: loaded };
    });
  });

  const open = $derived.by<{ guide: Guide; theme: GuideTheme } | null>(() => {
    if (!router.path || !library) return null;
    for (const theme of library.themes) {
      const guide = theme.guides.find((candidate) => candidate.id === router.path);
      if (guide) return { guide, theme };
    }
    return null;
  });

  const search = $derived(query.trim());
  const results = $derived(library && search ? searchGuides(library, search) : null);

  // The theme being read, lit in the table of contents: the first one until the page scrolls.
  let active = $state('');
  let themesEl = $state<HTMLElement>();
  let lockedUntil = 0;
  const current = $derived(library?.themes.some((theme) => theme.slug === active) ? active : (library?.themes[0]?.slug ?? ''));

  $effect(() => {
    const root = themesEl;
    if (!root || !library || typeof IntersectionObserver !== 'function') return;
    const sections = [...root.querySelectorAll<HTMLElement>('[data-theme]')];
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        // A jump keeps its theme lit, even when the page cannot scroll far enough to bring it up.
        if (performance.now() < lockedUntil) return;
        const first = sections.find((section) => visible.has(section));
        if (first) active = first.dataset.theme ?? '';
      },
      // A band under the top bar: the theme crossing it is the one being read.
      { rootMargin: '-96px 0px -60% 0px' },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  });

  function jump(slug: string) {
    active = slug;
    lockedUntil = performance.now() + 1000;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`theme-${slug}`)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  }
</script>

{#snippet entry(guide: Guide, theme?: string)}
  <li>
    <a class="entry" href={`#/guides/${guide.id}`}>
      <span class="grow">
        <span class="entry-title">{guide.title}</span>
        {#if theme}<span class="entry-theme">{theme}</span>{/if}
        <span class="entry-text muted small">{guide.description}</span>
      </span>
      <ChevronRight size={18} />
    </a>
  </li>
{/snippet}

{#if router.path}
  {#if open}
    <div class="stack">
      <div class="row no-print">
        <a class="btn ghost small" href="#/guides"><ArrowLeft size={18} />{t('guides.all')}</a>
        <span class="spacer"></span>
        <button class="btn small" onclick={() => window.print()}><Printer size={18} />{t('guides.print')}</button>
      </div>
      <article class="card guide" {lang}>
        <p class="theme">{open.theme.title}</p>
        <h1>{open.guide.title}</h1>
        <!-- Rendered at build time from the repository's own Markdown files, which allow no HTML. -->
        <div class="guide-body">{@html open.guide.html}</div>
      </article>
    </div>
  {:else if library}
    <div class="stack">
      <p>{t('guides.notFound')}</p>
      <p><a class="btn" href="#/guides"><ArrowLeft size={18} />{t('guides.all')}</a></p>
    </div>
  {/if}
{:else}
  <div class="stack">
    <header>
      <h1>{t('guides.title')}</h1>
      <p class="muted">{t('guides.intro')}</p>
    </header>

    <p class="notice muted small"><Info size={16} /><span>{t('guides.notice')}</span></p>

    <label class="search">
      <span class="visually-hidden">{t('guides.search')}</span>
      <Search size={18} />
      <input class="input" type="search" placeholder={t('guides.search')} bind:value={query} />
    </label>

    {#if results}
      <p class="muted small" aria-live="polite">
        {results.length > 0 ? tn('guides.results', results.length, { query: search }) : t('guides.noResult', { query: search })}
      </p>
      {#if results.length > 0}
        <section class="card" {lang}>
          <ul class="list">
            {#each results as { guide, theme } (guide.id)}
              {@render entry(guide, theme.title)}
            {/each}
          </ul>
        </section>
      {/if}
    {:else if library}
      <!-- Chips on phones, a sticky column on wider screens: both jump to a theme. -->
      <div class="library">
        <nav class="toc" aria-label={t('guides.themes')} {lang}>
          <p class="toc-title">{t('guides.themes')}</p>
          {#each library.themes as theme (theme.slug)}
            <button type="button" class:on={current === theme.slug} aria-current={current === theme.slug ? 'true' : undefined} onclick={() => jump(theme.slug)}>
              <ThemeIcon theme={theme.slug} size={18} />
              <span class="toc-name">{theme.title}</span>
              <span class="toc-count">{theme.guides.length}</span>
            </button>
          {/each}
        </nav>

        <div class="themes" bind:this={themesEl}>
          {#each library.themes as theme (theme.slug)}
            <section class="theme-block" id="theme-{theme.slug}" data-theme={theme.slug} {lang}>
              <h2 class="theme-head">
                <span class="theme-badge"><ThemeIcon theme={theme.slug} size={22} /></span>
                <span class="theme-name">{theme.title}</span>
                <span class="theme-count">{tn('guides.count', theme.guides.length)}</span>
              </h2>
              <div class="card entries">
                <ul class="list">
                  {#each theme.guides as guide (guide.id)}
                    {@render entry(guide)}
                  {/each}
                </ul>
              </div>
            </section>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* The warning stays in view without shouting: small grey text, no frame. */
  .notice {
    display: flex;
    gap: 0.5rem;
  }

  .notice :global(svg) {
    flex: none;
    margin-top: 0.15rem;
  }

  .search {
    position: relative;
    display: block;
  }

  .search :global(svg) {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
  }

  .search .input {
    padding-left: 2.5rem;
  }

  .list > li {
    padding: 0;
  }

  .entry {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0;
    color: var(--text);
    text-decoration: none;
  }

  .entry :global(svg) {
    flex: none;
    color: var(--muted);
  }

  .entry-title {
    font-weight: 600;
  }

  .entry:hover .entry-title {
    color: var(--primary);
    text-decoration: underline;
  }

  .entry-theme {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--primary);
  }

  .entry-text::first-letter {
    text-transform: uppercase;
  }

  .library {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Phones: the themes as a row of chips that scrolls sideways, fading out at the screen edge. */
  .toc {
    display: flex;
    gap: 0.4rem;
    margin-right: -1rem;
    padding: 2px 2.5rem 2px 2px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 2.5rem), transparent);
    mask-image: linear-gradient(90deg, #000 calc(100% - 2.5rem), transparent);
  }

  .toc::-webkit-scrollbar {
    display: none;
  }

  .toc-title {
    display: none;
  }

  .toc button {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 40px;
    padding: 0.3rem 0.8rem;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--control);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
  }

  .toc button :global(.theme-icon) {
    color: var(--primary);
  }

  .toc-count {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .toc button.on {
    background: var(--text);
    border-color: var(--text);
    color: var(--surface);
  }

  .toc button.on :global(.theme-icon),
  .toc button.on .toc-count {
    color: inherit;
  }

  .themes {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }

  .theme-block {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    /* Clears the sticky top bar after a jump. */
    scroll-margin-top: 5.5rem;
  }

  .theme-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.35rem;
  }

  .theme-badge {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius-sm);
    background: var(--primary-soft);
    color: var(--primary);
  }

  .theme-name {
    flex: 1;
    min-width: 0;
  }

  .theme-count {
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--muted);
    white-space: nowrap;
  }

  .entries {
    padding: 0 1rem;
  }

  /* Tablets and computers: a sticky column of themes beside the guides. */
  @media (min-width: 720px) {
    .library {
      display: grid;
      grid-template-columns: 15rem minmax(0, 1fr);
      align-items: start;
      gap: 1.5rem;
    }

    .toc {
      position: sticky;
      top: calc(68px + env(safe-area-inset-top, 0px) + 1rem);
      flex-direction: column;
      gap: 2px;
      max-height: calc(100vh - 7rem);
      margin: 0;
      padding: 0.75rem 0.5rem;
      overflow: auto;
      border: 1.5px solid var(--border);
      border-bottom-width: 4px;
      border-radius: var(--radius);
      background: var(--surface);
      -webkit-mask-image: none;
      mask-image: none;
    }

    .toc-title {
      display: block;
      margin: 0;
      padding: 0 0.5rem 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .toc button {
      width: 100%;
      min-height: 42px;
      padding: 0.35rem 0.5rem;
      border: none;
      border-radius: 6px;
      background: none;
      font-size: 0.95rem;
      white-space: normal;
      text-align: left;
    }

    .toc-name {
      flex: 1;
      min-width: 0;
    }

    .toc button:hover {
      background: var(--surface-2);
    }

    .toc button.on {
      background: var(--primary-soft);
      color: var(--primary);
      box-shadow: inset 3px 0 0 var(--primary);
    }

    .toc button.on :global(.theme-icon),
    .toc button.on .toc-count {
      color: var(--primary);
    }
  }

  .guide {
    padding: 1.25rem;
  }

  .theme {
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--primary);
  }

  .guide h1 {
    margin: 0.15rem 0 1rem;
  }

  /* The guide itself is HTML made from Markdown: style it from the outside. */
  .guide-body {
    max-width: 46rem;
    line-height: 1.6;
  }

  .guide-body :global(h2) {
    margin: 1.75rem 0 0.5rem;
    padding-top: 1rem;
    border-top: 1.5px solid var(--border);
  }

  .guide-body :global(h3) {
    margin: 1.25rem 0 0.4rem;
  }

  .guide-body :global(p) {
    margin: 0.6rem 0;
  }

  .guide-body :global(ul),
  .guide-body :global(ol) {
    margin: 0.5rem 0;
    padding-left: 1.4rem;
  }

  .guide-body :global(li) {
    margin: 0.35rem 0;
  }

  .guide-body :global(li::marker) {
    color: var(--primary);
    font-weight: 700;
  }

  .guide-body :global(a) {
    overflow-wrap: anywhere;
  }

  .guide-body :global(blockquote.summary) {
    margin: 0;
    padding: 0.9rem 1rem;
    border-left: 4px solid var(--primary);
    border-radius: var(--radius-sm);
    background: var(--primary-soft);
    font-size: 1.05rem;
  }

  .guide-body :global(blockquote.summary p) {
    margin: 0;
  }

  /* What never to do: crosses instead of bullets. */
  .guide-body :global(h2.never) {
    color: var(--danger);
  }

  .guide-body :global(h2.never + ul) {
    padding-left: 0;
    list-style: none;
  }

  .guide-body :global(h2.never + ul > li) {
    position: relative;
    padding-left: 1.6rem;
  }

  .guide-body :global(h2.never + ul > li::before) {
    content: '✕';
    position: absolute;
    left: 0.15rem;
    color: var(--danger);
    font-weight: 700;
  }

  /* Checked date and other-language link, under the last rule. */
  .guide-body :global(hr) {
    margin: 2rem 0 1rem;
    border: 0;
    border-top: 1.5px solid var(--border);
  }

  .guide-body :global(hr ~ p) {
    font-size: 0.9rem;
    color: var(--muted);
  }

  @media (min-width: 900px) {
    .guide {
      padding: 2rem;
    }
  }

  @media print {
    .guide {
      padding: 0;
      border: 0;
      background: none;
    }

    .guide-body {
      max-width: none;
    }

    .guide-body :global(h2),
    .guide-body :global(h3) {
      break-after: avoid;
    }

    .guide-body :global(li) {
      break-inside: avoid;
    }

    .guide-body :global(a) {
      color: inherit;
    }
  }
</style>
