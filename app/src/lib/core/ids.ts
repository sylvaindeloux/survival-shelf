let counter = 0;

/** Runtime-only identifier for a lot (lots have no id in the file). */
export function newLotId(): string {
  counter += 1;
  return `lot-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
