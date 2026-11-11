// English and Dutch. The home page and support page exist in both (/ and /nl,
// /support and /nl/support); privacy, terms and the 404 page are English only.
// Page copy lives with each page component (Home.astro, SupportPage.astro);
// this file holds what's shared: header, footer, the waitlist and the phone.
export type Lang = 'en' | 'nl';

export const HOME: Record<Lang, string> = { en: '/', nl: '/nl' };

// The same page in the other language, for the EN/NL switch and hreflang.
// Pages with no Dutch version switch to the Dutch home page.
export function otherLang(lang: Lang, path: string): { lang: Lang; href: string } {
  if (lang === 'nl') return { lang: 'en', href: path.replace(/^\/nl(?=\/|$)/, '') || '/' };
  if (path === '/' || path === '') return { lang: 'nl', href: '/nl' };
  if (path === '/support') return { lang: 'nl', href: '/nl/support' };
  return { lang: 'nl', href: '/nl' };
}

export const UI = {
  en: {
    skip: 'Skip to content',
    brandHome: 'NEVERMADE OUTDOOR CLUB, home',
    howItWorks: 'How it works',
    theApp: 'The app',
    getTheApp: 'Get the app',
    switchTo: 'Nederlands',
    motto: 'Do the things you haven’t done yet.',
    support: 'Support',
    supportHref: '/support',
    privacy: 'Privacy policy',
    terms: 'Terms',
    footerNote: 'Made in the Netherlands · No tracking on this site',
    waitlist: {
      label: 'Get told first',
      placeholder: 'you@example.com',
      idle: 'Notify me',
      sending: 'Sending…',
      done: 'On the list',
      ok: 'You’re on the list. See you at launch.',
      invalid: 'That email doesn’t look right. Try again?',
      error: 'Something went wrong. Please try again in a minute.',
      offline: 'No connection. Please try again.',
      note: 'One email when the app launches, nothing else. We only keep your address for that, never share or sell it, and delete it on request:',
    },
    showcase: {
      carousel: 'Screens from the NOC app. Use the arrow keys to move between them.',
      of: 'of',
      prev: 'Previous screen',
      next: 'Next screen',
      show: 'Show',
    },
  },
  nl: {
    skip: 'Naar de inhoud',
    brandHome: 'NEVERMADE OUTDOOR CLUB, home',
    howItWorks: 'Hoe het werkt',
    theApp: 'De app',
    getTheApp: 'Krijg de app',
    switchTo: 'English',
    motto: 'Doe wat je nog nooit hebt gedaan.',
    support: 'Support',
    supportHref: '/nl/support',
    privacy: 'Privacybeleid (Engels)',
    terms: 'Voorwaarden (Engels)',
    footerNote: 'Gemaakt in Nederland · Geen tracking op deze site',
    waitlist: {
      label: 'Hoor het als eerste',
      placeholder: 'jij@voorbeeld.nl',
      idle: 'Laat het me weten',
      sending: 'Versturen…',
      done: 'Op de lijst',
      ok: 'Je staat op de lijst. Tot bij de lancering.',
      invalid: 'Dat e-mailadres lijkt niet te kloppen. Nog een keer?',
      error: 'Er ging iets mis. Probeer het over een minuut opnieuw.',
      offline: 'Geen verbinding. Probeer het opnieuw.',
      note: 'Eén e-mail als de app uitkomt, verder niets. We bewaren je adres alleen daarvoor, delen of verkopen het nooit en verwijderen het op verzoek:',
    },
    showcase: {
      carousel: 'Schermen uit de NOC-app. Gebruik de pijltjestoetsen om te wisselen.',
      of: 'van',
      prev: 'Vorig scherm',
      next: 'Volgend scherm',
      show: 'Toon',
    },
  },
} as const;
