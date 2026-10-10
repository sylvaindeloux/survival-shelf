<script lang="ts">
  import { app } from '../app.svelte';
  import type { Lot } from '../core/types';
  import { expiryLabel } from './format';

  let { lot }: { lot: Lot } = $props();
  const label = $derived(expiryLabel(lot, app.shelf.settings, app.today));
</script>

<span class="pill {label.status}" title={label.title}>{label.text}</span>
