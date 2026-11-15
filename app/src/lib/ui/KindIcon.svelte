<script lang="ts" module>
  import BatteryMedium from '@lucide/svelte/icons/battery-medium';
  import Toolbox from '@lucide/svelte/icons/toolbox';
  import Utensils from '@lucide/svelte/icons/utensils';
  import type { Kind } from '../core/types';

  const ICONS: Record<Kind, typeof Utensils> = { food: Utensils, consumable: BatteryMedium, gear: Toolbox };
</script>

<script lang="ts">
  let { kind, size = 18 }: { kind: Kind; size?: number } = $props();

  const Icon = $derived(ICONS[kind]);
</script>

<span class="kind-icon" aria-hidden="true"><Icon {size} /></span>

<style>
  .kind-icon {
    display: inline-flex;
    flex: none;
  }
</style>
