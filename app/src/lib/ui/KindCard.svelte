<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import type { Snippet } from 'svelte';
  import type { Kind } from '../core/types';
  import { kindLabel } from './format';
  import KindIcon from './KindIcon.svelte';

  let {
    kind,
    href,
    subtitle,
    children,
  }: {
    kind: Kind;
    /** Sub-page of the kind, such as `#/stock/gear`. */
    href: string;
    subtitle: string;
    /** Status of the kind: badges, a gauge… */
    children?: Snippet;
  } = $props();
</script>

<a class="card kind-card" {href}>
  <span class="head">
    <span class="icon"><KindIcon {kind} size={26} /></span>
    <span class="title">
      <h2>{kindLabel(kind)}</h2>
      <span class="small muted">{subtitle}</span>
    </span>
    <ChevronRight size={20} class="chevron" />
  </span>
  {#if children}
    <span class="status">{@render children()}</span>
  {/if}
</a>

<style>
  .kind-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: var(--text);
    text-decoration: none;
  }

  .kind-card:hover {
    border-color: var(--control);
  }

  .kind-card:focus-visible {
    outline: 3px solid var(--primary);
    outline-offset: 2px;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    background: var(--primary-soft);
    color: var(--primary);
  }

  .title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  h2 {
    font-size: 1.6rem;
  }

  .head :global(.chevron) {
    flex: none;
    color: var(--muted);
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
