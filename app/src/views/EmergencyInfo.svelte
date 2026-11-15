<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleDashed from '@lucide/svelte/icons/circle-dashed';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Phone from '@lucide/svelte/icons/phone';
  import Printer from '@lucide/svelte/icons/printer';
  import { app } from '../lib/app.svelte';
  import { isIncomplete, needsPhone, phoneLink, PLAN_TOPICS, smsHref } from '../lib/core/emergency';
  import { formatDate, t } from '../lib/i18n/index.svelte';
  import { linesOf, markReviewed, ownTopics, reviewText, topicHint, topicIcon, topicTitle } from '../lib/ui/emergency';
  import { dialogs } from '../lib/ui/state.svelte';

  const entries = $derived(app.shelf.emergency);
  const status = $derived(app.emergency);
  const numbers = $derived(linesOf(entries, 'number'));
  // Five tiles a row fit a phone with names like "Pompiers"; a longer word, like "Emergencies", needs wider tiles.
  const wideTiles = $derived(numbers.some((line) => line.name.split(/\s+/).some((word) => word.length > 8)));
  // Who to call and where to meet, then what to do; topics of the user's own come last.
  const groups = $derived([['remote', 'contact', 'meeting'], ['role', 'shutoff', 'health'], ownTopics(entries)].filter((group) => group.length > 0));

  function edit(topic?: string) {
    dialogs.emergency = { topic };
  }
</script>

{#snippet todo(text: string, topic: string)}
  <button type="button" class="todo" onclick={() => edit(topic)}>
    <CircleDashed size={16} />
    <span>{text}</span>
    <ChevronRight size={16} class="no-print" />
  </button>
{/snippet}

{#snippet topicBlock(topic: string)}
  {@const lines = linesOf(entries, topic)}
  {@const Icon = topicIcon(topic)}
  <section class="topic">
    <h2 class="topic-head"><Icon size={22} />{topicTitle(topic)}</h2>
    {#if lines.length === 0}
      {@render todo(t('emergency.toFill', { hint: topicHint(topic) }), topic)}
    {/if}
    {#each lines as line, index (index)}
      {@const link = phoneLink(line.phone)}
      {#if isIncomplete(line)}
        {@render todo(line.name ? t('emergency.lineToFill', { name: line.name }) : t('emergency.toFill', { hint: topicHint(topic) }), topic)}
      {:else if needsPhone(topic) && link}
        <div class="contact">
          <span class="who">
            <span class="name">{line.name}</span>
            <span class="small muted">{[link.text, line.details].filter(Boolean).join(' · ')}</span>
          </span>
          <a class="btn small no-print" href={link.href} aria-label={t(link.sms ? 'emergency.textNumber' : 'emergency.callNumber', { number: link.text, name: line.name })}>
            {#if link.sms}<MessageSquare size={16} />{t('emergency.sms')}{:else}<Phone size={16} />{t('emergency.call')}{/if}
          </a>
          {#if topic === 'remote' && !link.sms}
            <a class="btn small no-print" href={smsHref(line.phone)} aria-label={t('emergency.textNumber', { number: link.text, name: line.name })}>
              <MessageSquare size={16} />{t('emergency.sms')}
            </a>
          {/if}
        </div>
      {:else}
        <p class="kv">
          <span class="k">{line.name}</span>
          <span class="v">
            {line.details}
            {#if link}<a class="phone num" href={link.href}>{link.text}</a>{/if}
          </span>
        </p>
      {/if}
    {/each}
    {#if topic === 'remote' && lines.some((line) => !isIncomplete(line))}
      <p class="small muted">{t('emergency.smsHint')}</p>
    {/if}
  </section>
{/snippet}

<div class="stack sheet">
  <a class="back no-print" href="#/emergency"><ChevronLeft size={18} />{t('nav.emergency')}</a>

  <header>
    <h1>{t('emergency.infoTitle')}</h1>
    <p class="muted">
      {t('emergency.filledOf', { count: status.filled.length, total: PLAN_TOPICS.length })} ·
      <span class:warn-text={status.reviewDue}>{reviewText()}</span>
    </p>
    <p class="print-only small">Survival Shelf · {t('print.printed', { date: formatDate(app.today) })}</p>
  </header>

  <div class="row wrap no-print">
    <button class="btn small" onclick={() => window.print()}><Printer size={16} />{t('action.print')}</button>
    <button class="btn small" onclick={() => edit()}><Pencil size={16} />{t('action.edit')}</button>
    <button class="btn small" class:primary={status.reviewDue} onclick={markReviewed}><Check size={16} />{t('emergency.reviewed')}</button>
  </div>

  <!-- The numbers to call first, big enough to hit in a hurry. -->
  <div class="numbers" class:wide={wideTiles}>
    {#each numbers as line, index (index)}
      {@const link = phoneLink(line.phone)}
      {#if link}
        <a
          class="number"
          href={link.href}
          aria-label={t(link.sms ? 'emergency.textNumber' : 'emergency.callNumber', { number: link.text, name: line.name })}
          title={line.details}
        >
          <b class="num" class:long={link.text.length > 4}>{link.text}</b>
          <small>{#if link.sms}<MessageSquare size={11} />{/if}{line.name}</small>
        </a>
      {/if}
    {/each}
  </div>
  {#each numbers.filter(isIncomplete) as line, index (index)}
    {@render todo(t('emergency.lineToFill', { name: line.name || topicTitle('number') }), 'number')}
  {/each}
  {#if numbers.length === 0}
    {@render todo(t('emergency.toFill', { hint: topicHint('number') }), 'number')}
  {/if}

  <div class="cards">
    {#each groups as topics, index (index)}
      <div class="card">
        {#each topics as topic, position (topic)}
          {#if position > 0}<hr />{/if}
          {@render topicBlock(topic)}
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    align-self: flex-start;
    margin-bottom: -0.25rem;
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
  }

  header p {
    margin: 0.25rem 0 0;
  }

  .warn-text {
    color: var(--warn);
    font-weight: 600;
  }

  .numbers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3.75rem, 1fr));
    gap: 6px;
  }

  .numbers.wide {
    grid-template-columns: repeat(auto-fill, minmax(4.75rem, 1fr));
  }

  .numbers:empty {
    display: none;
  }

  .number {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 64px;
    padding: 8px 2px;
    border: 1.5px solid var(--danger);
    border-radius: var(--radius-sm);
    background: var(--danger-soft);
    color: var(--danger);
    text-align: center;
    text-decoration: none;
  }

  .number:hover {
    border-width: 2.5px;
    padding: 7px 1px;
  }

  .number b {
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
    overflow-wrap: anywhere;
  }

  .number b.long {
    font-size: 1.05rem;
  }

  .number small {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    color: var(--text);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    /* A name too long for its tile wraps, at worst within a word, rather than spill out. */
    overflow-wrap: anywhere;
  }

  .cards {
    display: grid;
    gap: 0.875rem;
    align-items: start;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  hr {
    width: 100%;
    margin: 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  .topic {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .topic p {
    margin: 0;
  }

  .topic-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
  }

  .topic-head :global(svg) {
    flex: none;
    color: var(--primary);
  }

  .contact {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .who {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .name {
    font-weight: 600;
  }

  .contact .btn {
    flex: none;
  }

  .kv {
    display: flex;
    gap: 0.5rem;
  }

  .k {
    flex: none;
    width: 8rem;
    color: var(--muted);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .v {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .phone {
    margin-left: 0.25rem;
    color: var(--primary);
    font-weight: 600;
  }

  /* Something to fill in: dashed, in the warning color, and it opens the editor where it is needed. */
  .todo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 0.625rem;
    border: 1.5px dashed var(--warn);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--warn);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }

  .todo:hover {
    background: var(--warn-soft);
  }

  .todo span {
    flex: 1;
    min-width: 0;
  }

  .todo :global(svg) {
    flex: none;
  }

  @media (max-width: 380px) {
    .k {
      width: 6.5rem;
    }
  }

  @media (min-width: 720px) {
    .numbers,
    .numbers.wide {
      grid-template-columns: repeat(auto-fill, minmax(6.5rem, 8rem));
    }

    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* One page to post near the phone, as the guide advises: two columns, no buttons. */
  @media print {
    .sheet {
      gap: 8pt;
      font-size: 10pt;
    }

    h1 {
      font-size: 18pt;
    }

    .numbers,
    .numbers.wide {
      grid-template-columns: repeat(auto-fill, minmax(26mm, 1fr));
    }

    .number {
      min-height: 0;
      padding: 4pt;
      border-width: 1pt;
      background: none;
      color: #000;
    }

    .number b {
      font-size: 16pt;
    }

    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8pt;
    }

    .card {
      gap: 6pt;
      padding: 8pt;
      border-width: 1pt;
      break-inside: avoid;
    }

    .topic {
      gap: 3pt;
    }

    .topic-head {
      font-size: 12pt;
    }

    .todo {
      min-height: 0;
      padding: 4pt 6pt 14pt;
      border-width: 1pt;
      color: #444;
    }
  }
</style>
