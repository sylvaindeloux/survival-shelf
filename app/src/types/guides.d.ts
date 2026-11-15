// The practical guides, rendered at build time from the repository's guides/ folder by build/guides.ts.

declare module 'virtual:guides' {
  /** The guides of a language, in the order of its table of contents. */
  export function loadGuides(lang: import('../lib/core/types').Lang): Promise<import('../lib/guides/library').GuideLibrary>;
}
