<script lang="ts" module>
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Car from '@lucide/svelte/icons/car';
  import Compass from '@lucide/svelte/icons/compass';
  import Droplet from '@lucide/svelte/icons/droplet';
  import Flame from '@lucide/svelte/icons/flame';
  import HeartPulse from '@lucide/svelte/icons/heart-pulse';
  import House from '@lucide/svelte/icons/house';
  import MountainSnow from '@lucide/svelte/icons/mountain-snow';
  import Radio from '@lucide/svelte/icons/radio';
  import SoapDispenserDroplet from '@lucide/svelte/icons/soap-dispenser-droplet';
  import Thermometer from '@lucide/svelte/icons/thermometer';
  import Tornado from '@lucide/svelte/icons/tornado';
  import Trees from '@lucide/svelte/icons/trees';
  import Utensils from '@lucide/svelte/icons/utensils';

  /** Line icon of each guide theme, by its folder name in every language. A new theme gets a book until it has one. */
  const ICONS: Record<string, typeof BookOpen> = {
    basics: Compass,
    'les-bases': Compass,
    water: Droplet,
    eau: Droplet,
    food: Utensils,
    nourriture: Utensils,
    'cold-and-heat': Thermometer,
    'froid-et-chaleur': Thermometer,
    'fire-and-power': Flame,
    'feu-et-energie': Flame,
    'health-and-first-aid': HeartPulse,
    'sante-et-premiers-secours': HeartPulse,
    hygiene: SoapDispenserDroplet,
    disasters: Tornado,
    catastrophes: Tornado,
    'at-home': House,
    'a-la-maison': House,
    'in-the-car': Car,
    'en-voiture': Car,
    'communication-and-navigation': Radio,
    'communication-et-orientation': Radio,
    outdoors: Trees,
    'en-exterieur': Trees,
    'hostile-environments': MountainSnow,
    'milieux-hostiles': MountainSnow,
  };
</script>

<script lang="ts">
  let { theme, size = 20 }: { theme: string; size?: number } = $props();

  const Icon = $derived(ICONS[theme] ?? BookOpen);
</script>

<span class="theme-icon" aria-hidden="true"><Icon {size} /></span>

<style>
  .theme-icon {
    display: inline-flex;
    flex: none;
  }
</style>
