// The real app screens in the phone on the home page (src/components/AppShowcase.astro).
// Files live in public/app/ (made from iPhone screenshots in screens-src/ by
// `npm run screens`). `alt` describes the screen for people who can't see it;
// keep it true to the image.
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
    alt: 'The Home screen of the NOC app: a greeting, buttons for Community and Notifications, and "Near you", a list of nearby parks for a 5 km walk.',
  },
  {
    file: '2-next.webp',
    title: 'Next',
    caption: 'Pick your next first',
    alt: 'The Next screen: "What will you do next?" with a chosen first, the Red Trail from Bedoń to Wiskitno, a 15 km hike, with progress towards it and a Go button.',
  },
  {
    file: '3-explore.webp',
    title: 'Explore',
    caption: 'Find a place to get outside',
    alt: 'The Explore screen: search nearby by activity (walk, run, hike, ride) and distance, and curated routes around Łódź.',
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
    alt: 'The Mine screen: a profile with adventures, firsts and places, the current chapter "Getting moving", and a journal of outings.',
  },
];
