import { addMonths, parseDay, type Day } from './dates';
import { inLang, translations, type Lang, type Translated } from './languages';
import type { EmergencyEntry, EmergencyTopic, Shelf } from './types';

/** Topics in the order of the sheet: the numbers first, then who to call, where to meet and what to do. */
export const EMERGENCY_TOPICS: EmergencyTopic[] = ['number', 'remote', 'contact', 'meeting', 'role', 'shutoff', 'health'];

/** Topics of the household plan to fill in: all but the emergency numbers, which come filled in. */
export const PLAN_TOPICS: EmergencyTopic[] = EMERGENCY_TOPICS.filter((topic) => topic !== 'number');

export function isTopic(topic: string): topic is EmergencyTopic {
  return (EMERGENCY_TOPICS as string[]).includes(topic);
}

/** Lines of these topics are people or services to call: their phone number is what matters. */
export function needsPhone(topic: string): boolean {
  return topic === 'number' || topic === 'remote' || topic === 'contact';
}

export interface PhoneLink {
  /** `tel:` or `sms:` address, made of digits only: the file is untrusted input. */
  href: string;
  /** The number only takes text messages (written `SMS 114`). */
  sms: boolean;
  /** The number as written, without the SMS mark. */
  text: string;
}

const SMS_MARK = /^\s*sms\s*:?\s*/i;

/** What a phone cell dials: "01 23 45 67 89" calls, "SMS 114" texts. Null when there is no number in it. */
export function phoneLink(phone: string): PhoneLink | null {
  const sms = SMS_MARK.test(phone);
  const text = phone.replace(SMS_MARK, '').trim();
  const digits = text.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  if (!/\d/.test(digits)) return null;
  return { href: `${sms ? 'sms' : 'tel'}:${digits}`, sms, text };
}

/** The address to text a number that can also be called, like the out-of-area contact's. */
export function smsHref(phone: string): string | null {
  const link = phoneLink(phone);
  return link ? link.href.replace(/^tel:/, 'sms:') : null;
}

function digitsOf(phone: string): string {
  return phoneLink(phone)?.href.replace(/^\w+:/, '') ?? '';
}

/**
 * A line still to fill in: a number or contact without a phone number, a place, role, shut-off or
 * health line without details, or a line of the user's own topic with nothing but a name.
 */
export function isIncomplete(entry: EmergencyEntry): boolean {
  if (needsPhone(entry.topic)) return phoneLink(entry.phone) === null;
  if (isTopic(entry.topic)) return entry.details.trim() === '';
  return entry.details.trim() === '' && entry.phone.trim() === '';
}

/** The household plan is reviewed every six months (guide "Make a household plan" and its sources). */
export const REVIEW_MONTHS = 6;

export interface EmergencyStatus {
  /** Topics of the plan with at least one line, all of them filled in. */
  filled: EmergencyTopic[];
  /** Topics of the plan without any line, or with a line still to fill in. */
  missing: EmergencyTopic[];
  /** Day of the next review, null when the info was never reviewed. */
  reviewBy: Day | null;
  /** The last review is six months old or more. */
  reviewDue: boolean;
}

export function emergencyStatus(shelf: Shelf, today: Day): EmergencyStatus {
  const filled: EmergencyTopic[] = [];
  const missing: EmergencyTopic[] = [];
  for (const topic of PLAN_TOPICS) {
    const lines = shelf.emergency.filter((entry) => entry.topic === topic);
    (lines.length > 0 && !lines.some(isIncomplete) ? filled : missing).push(topic);
  }
  const reviewed = parseDay(shelf.settings.emergencyReviewed);
  const reviewBy = reviewed === null ? null : addMonths(reviewed, REVIEW_MONTHS);
  return { filled, missing, reviewBy, reviewDue: reviewBy !== null && reviewBy <= today };
}

export interface SuggestedNumber {
  phone: string;
  name: Translated;
  details: Translated;
}

export interface CountryNumbers {
  /** ISO 3166 region code (`EU` for the European Union), named in the user's language by the browser. */
  region: string;
  numbers: SuggestedNumber[];
}

const EU_112: SuggestedNumber = {
  phone: '112',
  name: { en: 'Emergencies', fr: 'Urgences' },
  details: { en: 'all emergencies, everywhere in the EU', fr: 'toutes les urgences, partout dans l’UE' },
};

const NORTH_AMERICA_911: SuggestedNumber = {
  phone: '911',
  name: { en: 'Emergencies', fr: 'Urgences' },
  details: { en: 'police, fire, medical', fr: 'police, pompiers, urgence médicale' },
};

/**
 * Emergency numbers to add in one tap, from the guide "Call the emergency services" and its sources,
 * checked in November 2026. A wrong number is dangerous: add a country only with an official source.
 * - European Union: European Commission, "112: EU Emergency number",
 *   https://digital-strategy.ec.europa.eu/en/policies/112
 * - France: Service-public.fr, "Alerter les secours (Samu, pompiers…) en cas d'urgence", republished by justice.fr,
 *   https://www.justice.fr/fiche/alerter-secours-samu-pompiers-cas-urgence
 * - United States: 911.gov, "Frequently Asked Questions", https://911.gov/calling-911/frequently-asked-questions
 * - Canada: CRTC, "9-1-1 services", https://crtc.gc.ca/eng/phone/911/
 */
export const COUNTRY_NUMBERS: CountryNumbers[] = [
  { region: 'EU', numbers: [EU_112] },
  {
    region: 'FR',
    numbers: [
      { phone: '15', name: { en: 'SAMU', fr: 'Samu' }, details: { en: 'medical emergency', fr: 'urgence médicale' } },
      { phone: '17', name: { en: 'Police', fr: 'Police' }, details: { en: 'police or gendarmerie', fr: 'police ou gendarmerie' } },
      {
        phone: '18',
        name: { en: 'Fire brigade', fr: 'Pompiers' },
        details: { en: 'fire, accident, person in danger', fr: 'incendie, accident, personne en péril' },
      },
      {
        phone: 'SMS 114',
        name: { en: 'By text', fr: 'Par SMS' },
        details: {
          en: 'deaf or hard of hearing, or when you cannot speak',
          fr: 'sourds ou malentendants, ou quand tu ne peux pas parler',
        },
      },
    ],
  },
  { region: 'US', numbers: [NORTH_AMERICA_911] },
  { region: 'CA', numbers: [NORTH_AMERICA_911] },
];

function entryOf(number: SuggestedNumber, lang: Lang): EmergencyEntry {
  return { topic: 'number', name: inLang(number.name, lang), details: inLang(number.details, lang), phone: number.phone, extra: {} };
}

/** The emergency info of a new file: the European 112 alone, the user adds the numbers of their country. */
export function defaultEmergency(lang: Lang): EmergencyEntry[] {
  return [entryOf(EU_112, lang)];
}

/** The numbers of a country that are not in the list yet. */
export function missingNumbers(entries: EmergencyEntry[], country: CountryNumbers): SuggestedNumber[] {
  const known = new Set(entries.map((entry) => digitsOf(entry.phone)).filter((digits) => digits !== ''));
  return country.numbers.filter((number) => !known.has(digitsOf(number.phone)));
}

/** Adds the numbers of a country that are not in the list yet, after the other emergency numbers. */
export function withCountryNumbers(entries: EmergencyEntry[], country: CountryNumbers, lang: Lang): EmergencyEntry[] {
  const added = missingNumbers(entries, country).map((number) => entryOf(number, lang));
  let at = 0;
  entries.forEach((entry, index) => {
    if (entry.topic === 'number') at = index + 1;
  });
  return [...entries.slice(0, at), ...added, ...entries.slice(at)];
}

const SUGGESTED = COUNTRY_NUMBERS.flatMap((country) => country.numbers);

function inLangIfSuggested(text: string, texts: Translated, lang: Lang): string {
  return translations(texts).includes(text.trim()) ? inLang(texts, lang) : text;
}

/**
 * A suggested number with the texts the app wrote for it in `lang`: the line follows the language of
 * the file, until the user writes their own name or details.
 */
export function localizedEntry(entry: EmergencyEntry, lang: Lang): EmergencyEntry {
  if (entry.topic !== 'number') return entry;
  const number = SUGGESTED.find((candidate) => digitsOf(candidate.phone) === digitsOf(entry.phone));
  if (!number) return entry;
  const name = inLangIfSuggested(entry.name, number.name, lang);
  const details = inLangIfSuggested(entry.details, number.details, lang);
  return name === entry.name && details === entry.details ? entry : { ...entry, name, details };
}
