<script lang="ts" module>
  import type { Component } from 'svelte';

  export interface SubTab {
    key: string;
    href: string;
    label: string;
    icon?: Component;
    /** Short state under the label: "1 expired", "2 missing"… */
    status?: string;
    tone?: 'danger' | 'warn' | 'ok' | 'muted';
    current: boolean;
  }
</script>

<script lang="ts">
  /** Second-level tabs: summary cards on phones, underlined tabs on wider screens. */
  let { label, items }: { label: string; items: SubTab[] } = $props();
</script>

<nav class="subtabs" aria-label={label}>
  {#each items as item (item.key)}
    <a href={item.href} aria-current={item.current ? 'page' : undefined}>
      {#if item.icon}<item.icon size={24} />{/if}
      <span class="text">
        <span class="label">{item.label}</span>
        {#if item.status}<small class={item.tone ?? 'muted'}>{item.status}</small>{/if}
      </span>
    </a>
  {/each}
</nav>

<style>
  .subtabs {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 8px;
  }

  a {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    padding: 9px 9px 10px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--text);
    text-decoration: none;
  }

  a :global(svg) {
    flex: none;
    color: var(--muted);
  }

  a[aria-current='page'] {
    background: var(--surface);
    border-color: var(--primary);
    border-bottom-width: 4px;
  }

  a[aria-current='page'] :global(svg) {
    color: var(--primary);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .label,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .label {
    /* The condensed face keeps "Consommables" whole on a phone card. */
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
  }

  small {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .danger {
    color: var(--danger);
  }

  .warn {
    color: var(--warn);
  }

  .ok {
    color: var(--ok);
  }

  .muted {
    color: var(--muted);
  }

  /* Small phones: tighter cards, then a smaller label below 360 px, so the labels stay whole. */
  @media (max-width: 380px) {
    a {
      padding: 8px 7px 9px;
    }

    small {
      font-size: 0.7rem;
    }
  }

  @media (max-width: 359px) {
    .label {
      font-size: 0.8125rem;
    }
  }

  @media (max-width: 339px) {
    .label {
      font-size: 0.75rem;
    }
  }

  /* Tablet and desktop: a row of underlined tabs. */
  @media (min-width: 720px) {
    .subtabs {
      display: flex;
      gap: 4px;
      border-bottom: 1.5px solid var(--border);
    }

    a {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      padding: 10px 16px 9px;
      margin-bottom: -1.5px;
      border: none;
      border-bottom: 3px solid transparent;
      border-radius: 0;
      background: none;
      color: var(--muted);
    }

    a :global(svg) {
      width: 20px;
      height: 20px;
    }

    a:hover {
      color: var(--text);
    }

    a[aria-current='page'] {
      background: none;
      border-bottom-color: var(--primary);
      color: var(--primary);
    }

    .text {
      flex-direction: row;
      align-items: baseline;
      gap: 8px;
    }

    .label {
      font-family: var(--font);
      font-size: 1rem;
    }

    small {
      font-size: 0.875rem;
    }
  }
</style>
