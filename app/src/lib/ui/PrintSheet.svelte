<script lang="ts">
  import { app } from '../app.svelte';
  import { CATEGORIES, KINDS } from '../core/categories';
  import { formatDate, t, tn } from '../i18n/index.svelte';
  import CategoryIcon from './CategoryIcon.svelte';
  import { categoryLabel, formatPace, kindLabel, quantity, wholeDays } from './format';

  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.key, index]));

  // Same order as the screens: by kind, then by category.
  const kinds = $derived(
    KINDS.map((kind) => {
      const byCategory = new Map<string, typeof app.summaries>();
      for (const summary of app.summaries) {
        if (summary.lots.length === 0 || summary.product.kind !== kind) continue;
        byCategory.set(summary.product.category, [...(byCategory.get(summary.product.category) ?? []), summary]);
      }
      const groups = [...byCategory.entries()].sort(
        ([a], [b]) => (categoryOrder.get(a) ?? 99) - (categoryOrder.get(b) ?? 99) || a.localeCompare(b),
      );
      return { kind, groups };
    }).filter((entry) => entry.groups.length > 0),
  );
</script>

<!-- Paper copy for when there is no power: inventory plus room to tally what is taken. -->
<div class="print-only sheet">
  <header>
    <h1>Survival Shelf · {t('print.title')}</h1>
    <p>
      {t('print.printed', { date: formatDate(app.today) })} · {tn('home.household', app.shelf.settings.people)} ·
      {t('print.autonomy', { days: wholeDays(app.autonomy.days) })}
    </p>
  </header>

  {#each kinds as { kind, groups } (kind)}
    <h2 class="kind">{kindLabel(kind)}</h2>
    {#each groups as [category, summaries] (category)}
      <section>
        <h3 class="category"><CategoryIcon {category} size={18} />{categoryLabel(category)}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('lot.product')}</th>
              <th class="qty">{t('lot.qty')}</th>
              <th>{t('lot.expires')}</th>
              <th>{t('lot.location')}</th>
              <th class="tally">{t('print.taken')}</th>
            </tr>
          </thead>
          <tbody>
            {#each summaries as summary (summary.product.name)}
              {#each summary.lots as lot (lot.id)}
                <tr>
                  <td>{summary.product.name}</td>
                  <td class="qty">{quantity(lot.qty, summary.product)}</td>
                  <td>{lot.expires ? formatDate(lot.expires) : '—'}</td>
                  <td>{lot.location}</td>
                  <td class="tally"></td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </section>
    {/each}
  {/each}

  {#if app.rotation.items.length > 0}
    <section>
      <h2>{t('print.rotation')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('lot.product')}</th>
            <th>{t('print.pace')}</th>
            <th>{t('print.consumeBy')}</th>
          </tr>
        </thead>
        <tbody>
          {#each app.rotation.items as item (item.product.name)}
            <tr>
              <td>{item.product.name}</td>
              <td>{formatPace(item.perWeek, item.product)}</td>
              <td>{formatDate(item.consumeBy)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
</div>

<style>
  .sheet {
    font-size: 10pt;
    color: #000;
  }

  header {
    margin-bottom: 12pt;
  }

  h1 {
    font-size: 16pt;
  }

  h2 {
    font-size: 12pt;
    margin: 12pt 0 4pt;
  }

  h2.kind {
    font-size: 14pt;
    margin-top: 16pt;
    border-bottom: 1.5pt solid #000;
  }

  h3.category {
    display: flex;
    align-items: center;
    gap: 6pt;
    font-size: 11pt;
    margin: 10pt 0 4pt;
  }

  section {
    break-inside: avoid-page;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  th:first-child {
    width: 32%;
  }

  th,
  td {
    border: 1px solid #888;
    padding: 3pt 5pt;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #eee;
  }

  .qty {
    white-space: nowrap;
  }

  .tally {
    width: 26%;
  }
</style>
