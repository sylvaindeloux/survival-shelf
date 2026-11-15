<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Printer from '@lucide/svelte/icons/printer';
  import Search from '@lucide/svelte/icons/search';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { loadGuides } from 'virtual:guides';
  import { LANGS, type Lang } from '../lib/core/types';
  import { searchGuides, type Guide, type GuideLibrary, type GuideTheme } from '../lib/guides/library';
  import { i18n, t, tn } from '../lib/i18n/index.svelte';
  import { router } from '../lib/ui/state.svelte';

  /** The same guides as plain Markdown files, for whoever wants them without the app. */
  const FILES = 'https://github.com/sylvaindeloux/survival-shelf/tree/master/guides';

  // The guides are the Markdown files of the repository's guides/ folder, rendered at build time
  // and loaded one language at a time.
  let libraries = $state.raw<Partial<Record<Lang, GuideLibrary>>>({});
  let query = $state('');

  // The table of contents follows the app language. An open guide is shown in its own language,
  // so the link to its other-language version works whatever the app language.
  const lang = $derived.by<Lang>(() => {
    const first = router.path.split('/')[0];
    return (LANGS as string[]).includes(first) ? (first as Lang) : i18n.lang;
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

    <p class="notice"><TriangleAlert size={18} /><span>{t('guides.notice')}</span></p>

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
        <section class="card">
          <ul class="list">
            {#each results as { guide, theme } (guide.id)}
              {@render entry(guide, theme.title)}
            {/each}
          </ul>
        </section>
      {/if}
    {:else if library}
      {#each library.themes as theme (theme.slug)}
        <section class="card">
          <h2>{theme.title}</h2>
          <ul class="list">
            {#each theme.guides as guide (guide.id)}
              {@render entry(guide)}
            {/each}
          </ul>
        </section>
      {/each}
      <p class="muted small">{t('guides.more')}</p>
    {/if}

    <section class="card stack">
      <h2>{t('guides.offlineTitle')}</h2>
      <p class="small">{t('guides.offlineText')}</p>
      <p>
        <a class="btn" href={FILES} target="_blank" rel="noopener"><ExternalLink size={18} />{t('guides.files')}</a>
      </p>
    </section>
  </div>
{/if}

<style>
  h2 {
    margin-bottom: 0.25rem;
  }

  .notice {
    display: flex;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border: 1.5px solid color-mix(in srgb, var(--warn) 40%, var(--border));
    border-radius: var(--radius);
    background: var(--warn-soft);
    font-size: 0.9rem;
  }

  .notice :global(svg) {
    flex: none;
    margin-top: 0.15rem;
    color: var(--warn);
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
