<script lang="ts">
  import X from '@lucide/svelte/icons/x';
  import { app } from '../app.svelte';
  import { t } from '../i18n/index.svelte';
</script>

<div class="toasts screen-only" role="status" aria-live="polite">
  {#each app.toasts as toast (toast.id)}
    <div class="toast {toast.kind}">
      <span class="message">{toast.message}</span>
      {#if toast.action}
        <button
          type="button"
          class="action"
          onclick={() => {
            toast.action?.run();
            app.dismissToast(toast.id);
          }}>{toast.action.label}</button
        >
      {/if}
      <button type="button" class="close" onclick={() => app.dismissToast(toast.id)} aria-label={t('action.close')}>
        <X size={16} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    left: 50%;
    bottom: calc(var(--nav-height) + var(--safe-bottom) + 12px);
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(92vw, 440px);
    pointer-events: none;
  }

  @media (min-width: 900px) {
    .toasts {
      bottom: 24px;
    }
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.5rem 0.6rem 1rem;
    border-radius: 12px;
    background: #1e2622;
    color: #f1f3ef;
    box-shadow: 0 8px 30px rgb(0 0 0 / 25%);
    pointer-events: auto;
    animation: rise 0.2s ease-out;
  }

  .toast.error {
    background: #7a1d17;
  }

  .message {
    flex: 1;
    font-size: 0.9rem;
  }

  .action {
    border: none;
    background: transparent;
    color: #9fd8b6;
    font-weight: 700;
    cursor: pointer;
    padding: 0.4rem 0.5rem;
  }

  .close {
    display: inline-flex;
    border: none;
    background: transparent;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
    padding: 0.4rem;
  }

  @keyframes rise {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
  }
</style>
