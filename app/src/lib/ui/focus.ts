/** Where a person types or picks something: boxes to tick, radio cards and buttons are not fields. */
const FIELDS = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]):not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
].join(', ');

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** A finger rather than a mouse: focusing a text field there opens the on-screen keyboard. */
function touchScreen(): boolean {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

/**
 * Focuses the first field of a form that just opened, so that typing can start at once.
 * Not on a touch screen: the keyboard that comes with it would cover half of the sheet and its buttons.
 */
export function focusFirstField(container: ParentNode): void {
  if (touchScreen()) return;
  container.querySelector<Field>(FIELDS)?.focus();
}
