// The real app screens in the phone on the home page (src/components/AppShowcase.astro).
// Files live in public/app/ (made from iPhone screenshots in screens-src/ by
// `npm run screens`). `alt` describes the screen for people who can't see it;
// keep it true to the image.
// (Next is out for now: the new-colour screenshot of it is still to come.)
export interface AppScreen {
  file: string;
  title: string;
  caption: string;
  alt: string;
}

export const APP_SCREENS: AppScreen[] = [
  {
    file: '1-home.webp',
    title: 'Home',
    caption: 'Spots to get outside, near you',
    alt: 'The Home screen of the NOC app: a greeting for Noor, buttons for Community and Notifications, and "Near you", a list of nearby parks in Amsterdam for a 5 km walk, such as Vondelpark and Westerpark.',
  },
  {
    file: '3-explore.webp',
    title: 'Explore',
    caption: 'Find a place to get outside',
    alt: 'The Explore screen: search nearby by activity (walk, run, hike, ride) and distance, and curated routes around Amsterdam.',
  },
  {
    file: '4-go.webp',
    title: 'Go',
    caption: 'Choose your activity and go',
    alt: 'The Go screen: choose Walk, Run, Hike or Ride to start recording an outing.',
  },
  {
    file: '5-mine.webp',
    title: 'Mine',
    caption: 'Your journal of firsts',
    alt: 'The Mine screen: Noor’s profile (@noor.outside, Amsterdam) with 64 adventures, 487.3 km, 21 firsts and 12 places, the chapter "Chasing firsts", and a journal with a 16.4 km hike near Amsterdam that earned a first half-day hike.',
  },
];
