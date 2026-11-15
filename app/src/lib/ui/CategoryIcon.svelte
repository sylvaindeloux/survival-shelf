<script lang="ts" module>
  import Amphora from '@lucide/svelte/icons/amphora';
  import Bean from '@lucide/svelte/icons/bean';
  import BatteryFull from '@lucide/svelte/icons/battery-full';
  import BriefcaseMedical from '@lucide/svelte/icons/briefcase-medical';
  import Can from '@lucide/svelte/icons/can';
  import Candy from '@lucide/svelte/icons/candy';
  import Coffee from '@lucide/svelte/icons/coffee';
  import CookingPot from '@lucide/svelte/icons/cooking-pot';
  import Droplet from '@lucide/svelte/icons/droplet';
  import Funnel from '@lucide/svelte/icons/funnel';
  import Leaf from '@lucide/svelte/icons/leaf';
  import Milk from '@lucide/svelte/icons/milk';
  import Package from '@lucide/svelte/icons/package';
  import PawPrint from '@lucide/svelte/icons/paw-print';
  import SoapDispenserDroplet from '@lucide/svelte/icons/soap-dispenser-droplet';
  import Wheat from '@lucide/svelte/icons/wheat';
  import Wrench from '@lucide/svelte/icons/wrench';
  import { findCategory } from '../core/categories';

  /** Line icon for each known category key. Unknown categories get the "other" box. */
  const ICONS: Record<string, typeof Package> = {
    water: Droplet,
    'water-treatment': Funnel,
    grains: Wheat,
    legumes: Bean,
    canned: Can,
    'ready-meals': CookingPot,
    dairy: Milk,
    fats: Amphora,
    sweets: Candy,
    drinks: Coffee,
    condiments: Leaf,
    pets: PawPrint,
    hygiene: SoapDispenserDroplet,
    medical: BriefcaseMedical,
    energy: BatteryFull,
    tools: Wrench,
    other: Package,
  };
</script>

<script lang="ts">
  let { category, size = 20 }: { category: string; size?: number } = $props();

  const known = $derived(findCategory(category));
  const Icon = $derived(ICONS[known?.key ?? 'other'] ?? Package);
  // Water in blue, food in orange, everything else stays neutral.
  const tone = $derived(
    known?.key === 'water' || known?.key === 'water-treatment' ? 'water' : known?.kind === 'food' ? 'food' : 'other',
  );
</script>

<span class="category-icon {tone}" aria-hidden="true"><Icon {size} /></span>

<style>
  .category-icon {
    display: inline-flex;
    flex: none;
    color: var(--muted);
  }

  .water {
    color: var(--water);
  }

  .food {
    color: var(--food);
  }
</style>
