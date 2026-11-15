<script lang="ts">
  import { KINDS } from '../core/categories';
  import type { Kind } from '../core/types';
  import { t } from '../i18n/index.svelte';
  import { KIND_TEXTS, kindLabel } from './format';
  import KindIcon from './KindIcon.svelte';

  let {
    value = $bindable(),
    onpick,
  }: {
    value: Kind;
    /** Called when the user picks a kind, not when the value changes from outside. */
    onpick?: (kind: Kind) => void;
  } = $props();

  const name = `kind-${Math.random().toString(36).slice(2)}`;
</script>

<fieldset class="kind-picker">
  <legend>{t('kind.label')}</legend>
  {#each KINDS as kind (kind)}
    <label class="option" class:active={value === kind}>
      <input
        type="radio"
        {name}
        value={kind}
        checked={value === kind}
        onchange={() => {
          value = kind;
          onpick?.(kind);
        }}
      />
      <span class="text">
        <strong>{kindLabel(kind)}</strong>
        <span class="hint">{t(KIND_TEXTS[kind].hint)}</span>
      </span>
      <span class="icon"><KindIcon {kind} size={22} /></span>
    </label>
  {/each}
</fieldset>

<style>
  .kind-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }

  legend {
    padding: 0;
    margin-bottom: 0.3rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.7rem 0.75rem;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
  }

  .option:hover {
    border-color: var(--control);
  }

  .option.active {
    border: 2px solid var(--primary);
    padding: calc(0.7rem - 0.5px) calc(0.75rem - 0.5px);
    background: var(--primary-soft);
  }

  .option:has(input:focus-visible) {
    outline: 3px solid var(--primary);
    outline-offset: 2px;
  }

  input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 0.1rem 0 0;
    accent-color: var(--primary);
  }

  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  strong {
    font-size: 1.05rem;
  }

  .hint {
    margin: 0;
  }

  .icon {
    display: inline-flex;
    flex: none;
    color: var(--primary);
  }
</style>
