<script lang="ts">
  import X from '@lucide/svelte/icons/x';
  import type { Snippet } from 'svelte';
  import { t } from '../i18n/index.svelte';

  interface Props {
    title: string;
    onclose: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { title, onclose, children, footer }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
    return () => dialog.close();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  class="dialog"
  aria-label={title}
  oncancel={(event) => {
    event.preventDefault();
    onclose();
  }}
  onclick={(event) => {
    if (event.target === dialog) onclose();
  }}
>
  <div class="inner">
    <header>
      <h2>{title}</h2>
      <button type="button" class="icon-btn" onclick={onclose} aria-label={t('action.close')}><X size={20} /></button>
    </header>
    <div class="body">
      {@render children()}
    </div>
    {#if footer}
      <footer>{@render footer()}</footer>
    {/if}
  </div>
</dialog>

<style>
  .dialog {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text);
    width: 100%;
    max-width: 540px;
    max-height: 100dvh;
    margin: auto;
  }

  .dialog::backdrop {
    background: rgb(10 15 12 / 45%);
    backdrop-filter: blur(2px);
  }

  .inner {
    display: flex;
    flex-direction: column;
    max-height: min(92dvh, 760px);
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: 0 20px 60px rgb(0 0 0 / 25%);
    overflow: hidden;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem 0.5rem 1.25rem;
  }

  .body {
    padding: 0.25rem 1.25rem 1rem;
    overflow-y: auto;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
    padding: 0.75rem 1.25rem calc(0.75rem + var(--safe-bottom));
    border-top: 1px solid var(--border);
    background: var(--surface);
  }

  /* Bottom sheet on phones. */
  @media (max-width: 600px) {
    .dialog {
      margin: auto 0 0;
      max-width: 100%;
    }

    .inner {
      border-radius: var(--radius) var(--radius) 0 0;
      max-height: 92dvh;
    }
  }
</style>
