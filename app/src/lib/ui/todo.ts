import { app } from '../app.svelte';
import { buyCount } from '../core/checkin';

export interface TodoCounts {
  discard: number;
  consume: number;
  replace: number;
  buy: number;
  /** 1 when the emergency info is due for a review. */
  review: number;
  /** Go-bags due for their yearly check. */
  bags: number;
  total: number;
}

/** What the to-do list holds, by action: the home screen and the list itself show the same numbers. */
export function todoCounts(): TodoCounts {
  const { checkin } = app;
  const counts = {
    discard: checkin.discard.length,
    consume: checkin.consume.length,
    replace: checkin.replace.length,
    buy: buyCount(checkin.buy),
    review: app.emergency.reviewDue ? 1 : 0,
    bags: app.bags.filter((bag) => bag.checkDue).length,
  };
  return { ...counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}
