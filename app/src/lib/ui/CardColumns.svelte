<script lang="ts" generics="T extends { key: string; weight: number }">
  import type { Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { leftColumnCount } from '../core/columns';

  /**
   * Cards in two columns on wider screens, filled like a newspaper: the first ones down the left column,
   * the others down the right one. On phones, one column.
   *
   * Two real columns rather than CSS columns: some browsers carry the space under the last card of the
   * left column over to the top of the right one, which then starts lower than the left one.
   */
  let {
    items,
    card,
    single = false,
  }: {
    /** The cards, in their order. `weight` is about how tall the card is, in rows of a list. */
    items: readonly T[];
    card: Snippet<[T]>;
    /** One column on every screen, for a single list. */
    single?: boolean;
  } = $props();

  // The width the page layouts switch to two columns at.
  const wide = new MediaQuery('min-width: 720px');

  const columns = $derived.by(() => {
    if (single || !wide.current || items.length < 2) return [items];
    const left = leftColumnCount(items.map((item) => item.weight));
    return [items.slice(0, left), items.slice(left)];
  });
</script>

<div class="card-columns" class:split={columns.length > 1}>
  {#each columns as column, index (index)}
    <div class="column">
      {#each column as item (item.key)}
        {@render card(item)}
      {/each}
    </div>
  {/each}
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    min-width: 0;
  }

  /* Each column is as long as its cards: both start on the same line. */
  .split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 1rem;
  }
</style>
