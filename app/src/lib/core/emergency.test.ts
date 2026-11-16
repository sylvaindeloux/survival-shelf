import { describe, expect, it } from 'vitest';
import { dayFromParts } from './dates';
import { emptyShelf } from './defaults';
import {
  COUNTRY_NUMBERS,
  defaultEmergency,
  emergencyStatus,
  isIncomplete,
  localizedEntry,
  missingNumbers,
  phoneLink,
  smsHref,
  withCountryNumbers,
} from './emergency';
import type { EmergencyEntry } from './types';

function entry(topic: string, name: string, details = '', phone = ''): EmergencyEntry {
  return { topic, name, details, phone, extra: {} };
}

const country = (region: string) => COUNTRY_NUMBERS.find((candidate) => candidate.region === region)!;

describe('phone numbers', () => {
  it('calls the digits of a number, whatever the spaces, dots or dashes', () => {
    expect(phoneLink('06 12 34 56 78')).toEqual({ href: 'tel:0612345678', sms: false, text: '06 12 34 56 78' });
    expect(phoneLink('+33 6.12.34-56-78')?.href).toBe('tel:+33612345678');
    expect(phoneLink('112')?.href).toBe('tel:112');
  });

  it('texts a number written after SMS', () => {
    expect(phoneLink('SMS 114')).toEqual({ href: 'sms:114', sms: true, text: '114' });
    expect(phoneLink('sms: 114')?.href).toBe('sms:114');
    expect(smsHref('06 12 34 56 78')).toBe('sms:0612345678');
  });

  it('never makes a link of anything but digits', () => {
    expect(phoneLink('')).toBeNull();
    expect(phoneLink('in the address book')).toBeNull();
    expect(phoneLink('javascript:alert(1)')?.href).toBe('tel:1');
    expect(smsHref('none')).toBeNull();
  });
});

describe('emergency info', () => {
  it('starts with the European 112, in the language of the file', () => {
    expect(defaultEmergency('fr')).toEqual([entry('number', 'Urgences', 'toutes les urgences, partout dans l’UE', '112')]);
    expect(emptyShelf('en').emergency).toEqual([entry('number', 'Emergencies', 'all emergencies, everywhere in the EU', '112')]);
  });

  it('needs a phone number for people to call, and details for the rest', () => {
    expect(isIncomplete(entry('remote', 'Claire', 'in Lyon'))).toBe(true);
    expect(isIncomplete(entry('remote', 'Claire', '', '06 00 00 00 00'))).toBe(false);
    expect(isIncomplete(entry('number', 'Emergencies', '', '112'))).toBe(false);
    expect(isIncomplete(entry('meeting', 'Outside the neighborhood'))).toBe(true);
    expect(isIncomplete(entry('shutoff', 'Gas', 'valve under the sink'))).toBe(false);
    expect(isIncomplete(entry('Neighbors', 'Mrs Lee'))).toBe(true);
    expect(isIncomplete(entry('Neighbors', 'Mrs Lee', '2nd floor'))).toBe(false);
  });

  it('counts the topics of the plan filled in, without the emergency numbers', () => {
    const shelf = emptyShelf('en');
    shelf.emergency.push(
      entry('remote', 'Claire', 'in Lyon', '06 00 00 00 00'),
      entry('meeting', 'Outside our home', 'the gate'),
      entry('meeting', 'Outside the neighborhood'),
      entry('role', 'Alex', 'takes the bags'),
    );
    const status = emergencyStatus(shelf, dayFromParts(2026, 11, 15));
    expect(status.filled).toEqual(['remote', 'role']);
    expect(status.missing).toEqual(['contact', 'meeting', 'shutoff', 'health']);
  });

  it('asks for a review six months after the last one', () => {
    const shelf = emptyShelf('en');
    const today = dayFromParts(2026, 11, 15);
    expect(emergencyStatus(shelf, today)).toMatchObject({ reviewBy: null, reviewDue: false });
    shelf.settings.emergencyReviewed = '2026-05-16';
    expect(emergencyStatus(shelf, today)).toMatchObject({ reviewBy: dayFromParts(2026, 11, 16), reviewDue: false });
    shelf.settings.emergencyReviewed = '2026-05-15';
    expect(emergencyStatus(shelf, today)).toMatchObject({ reviewBy: today, reviewDue: true });
  });
});

describe('numbers by country', () => {
  it('cites a source for every country it suggests', () => {
    // The sources are in the comment of COUNTRY_NUMBERS: a new country needs one there too.
    expect(COUNTRY_NUMBERS.map((candidate) => candidate.region)).toEqual(['EU', 'FR', 'US', 'CA']);
  });

  it('adds the numbers of a country after the other numbers, without the ones already there', () => {
    const entries = [entry('number', 'Urgences', '', '112'), entry('number', 'Sourds', '', '114'), entry('remote', 'Claire', '', '06')];
    expect(missingNumbers(entries, country('FR')).map((number) => number.phone)).toEqual(['15', '17', '18']);
    const added = withCountryNumbers(entries, country('FR'), 'fr');
    expect(added.map((line) => line.phone)).toEqual(['112', '114', '15', '17', '18', '06']);
    expect(added[2]).toEqual(entry('number', 'Samu', 'urgence médicale', '15'));
    expect(withCountryNumbers([], country('EU'), 'en')).toEqual(defaultEmergency('en'));
  });

  it('translates the texts the app wrote for a number, and keeps the ones the user wrote', () => {
    const [english] = defaultEmergency('en');
    expect(localizedEntry(english, 'fr')).toEqual(defaultEmergency('fr')[0]);
    const own = { ...english, name: 'Pan-European line' };
    expect(localizedEntry(own, 'fr')).toEqual({ ...own, details: 'toutes les urgences, partout dans l’UE' });
    const contact = entry('remote', 'Emergencies', 'all emergencies, everywhere in the EU', '112');
    expect(localizedEntry(contact, 'fr')).toBe(contact);
  });
});
