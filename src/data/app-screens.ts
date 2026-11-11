// The real app screens in the phone on the home page (src/components/AppShowcase.astro).
// Files live in public/app/ (made from iPhone screenshots in screens-src/ by
// `npm run screens`). `alt` describes the screen for people who can't see it;
// keep it true to the image, in both languages. `title` is the app's own tab
// name (the app is in English), so it isn't translated.
// Next is the old-palette screenshot recoloured to the new palette (no fresh one yet).
import type { Lang } from '../i18n';

export interface AppScreen {
  file: string;
  title: string;
  caption: Record<Lang, string>;
  alt: Record<Lang, string>;
}

export const APP_SCREENS: AppScreen[] = [
  {
    file: '1-home.webp',
    title: 'Home',
    caption: { en: 'Spots to get outside, near you', nl: 'Plekken om naar buiten te gaan, bij jou in de buurt' },
    alt: {
      en: 'The Home screen of the NOC app: a greeting for Noor, buttons for Community and Notifications, and "Near you", a list of nearby parks in Amsterdam for a 5 km walk, such as Vondelpark and Westerpark.',
      nl: 'Het Home-scherm van de NOC-app: een begroeting voor Noor, knoppen voor Community en Notifications, en "Near you", een lijst met parken in Amsterdam voor een wandeling van 5 km, zoals het Vondelpark en het Westerpark.',
    },
  },
  {
    file: '2-next.webp',
    title: 'Next',
    caption: { en: 'Pick your next first', nl: 'Kies je volgende eerste keer' },
    alt: {
      en: 'The Next screen: "What will you do next?" with a chosen first, a 20 km hike along the Amstel from Amsterdam to Ouderkerk and back, 16.4 km best so far (82% of the way) and a Go button.',
      nl: 'Het Next-scherm: "What will you do next?" met een gekozen eerste keer, een hike van 20 km langs de Amstel van Amsterdam naar Ouderkerk en terug, 16,4 km als beste tot nu toe (82% van de afstand) en een Go-knop.',
    },
  },
  {
    file: '3-explore.webp',
    title: 'Explore',
    caption: { en: 'Find a place to get outside', nl: 'Vind een plek om naar buiten te gaan' },
    alt: {
      en: 'The Explore screen: search nearby by activity (walk, run, hike, ride) and distance, and NOC’s curated routes.',
      nl: 'Het Explore-scherm: zoek in de buurt op activiteit (wandelen, hardlopen, hiken, fietsen) en afstand, en de routes die NOC heeft uitgekozen.',
    },
  },
  {
    file: '4-go.webp',
    title: 'Go',
    caption: { en: 'Choose your activity and go', nl: 'Kies je activiteit en ga' },
    alt: {
      en: 'The Go screen: choose Walk, Run, Hike or Ride to start recording an outing.',
      nl: 'Het Go-scherm: kies Walk, Run, Hike of Ride om een tocht op te nemen.',
    },
  },
  {
    file: '5-mine.webp',
    title: 'Mine',
    caption: { en: 'Your journal of firsts', nl: 'Je dagboek van eerste keren' },
    alt: {
      en: 'The Mine screen: Noor’s profile (@noor.outside, Amsterdam) with 64 adventures, 487.3 km, 21 firsts and 12 places, the chapter "Chasing firsts", and a journal with a 16.4 km hike near Amsterdam that earned a first half-day hike.',
      nl: 'Het Mine-scherm: het profiel van Noor (@noor.outside, Amsterdam) met 64 avonturen, 487,3 km, 21 eerste keren en 12 plekken, het hoofdstuk "Chasing firsts", en een dagboek met een hike van 16,4 km bij Amsterdam, goed voor een eerste halve-dagtocht.',
    },
  },
];
