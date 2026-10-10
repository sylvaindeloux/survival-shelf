<script lang="ts">
  import logo from '../../../public/favicon.svg?raw';

  let { size = 40 }: { size?: number } = $props();
</script>

<span class="logo" style:width="{size}px" style:height="{size}px" aria-hidden="true">{@html logo}</span>

<style>
  .logo {
    display: inline-flex;
    flex: none;
  }

  .logo :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
