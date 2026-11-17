import { describe, expect, it } from 'vitest';
import { dayFromParts } from './dates';
import { isPublicCopy, ONLINE_WARNING_SNOOZE_DAYS, showOnlineWarning, storagePrefix } from './hosting';

describe('hosting', () => {
  it('recognizes the public copy on GitHub Pages, forks included', () => {
    expect(isPublicCopy('sylvaindeloux.github.io')).toBe(true);
    expect(isPublicCopy('someone-else.github.io')).toBe(true);
    expect(isPublicCopy('Sylvaindeloux.GitHub.io')).toBe(true);
  });

  it('leaves own copies alone: file, home server, development', () => {
    for (const host of ['', 'localhost', '127.0.0.1', '192.168.1.20', 'nas.local', 'shelf.example.org', 'github.io.example.org', 'notgithub.io']) {
      expect(isPublicCopy(host)).toBe(false);
    }
  });

  it('shows the warning again once the snooze is over', () => {
    const today = dayFromParts(2026, 11, 15);
    const host = 'sylvaindeloux.github.io';
    expect(showOnlineWarning(host, null, today)).toBe(true);
    expect(showOnlineWarning(host, today + ONLINE_WARNING_SNOOZE_DAYS, today)).toBe(false);
    expect(showOnlineWarning(host, today, today)).toBe(true);
    expect(showOnlineWarning('localhost', null, today)).toBe(false);
  });

  it('keeps the storage names of the main copy, and gives each pull request preview its own', () => {
    expect(storagePrefix('')).toBe('survival-shelf');
    expect(storagePrefix('47')).toBe('survival-shelf-preview-47');
    expect(storagePrefix('48')).not.toBe(storagePrefix('47'));
  });
});
