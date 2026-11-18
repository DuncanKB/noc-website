// The welcome email for a new waitlist sign-up (sent by worker/index.ts through
// Resend, the same service as the app's emails). Same look as the app's emails
// (nevermade-app/supabase/email): light by default, dark where the email app
// allows (Apple Mail follows dark mode; Gmail on iPhone flips colours itself).
// English or Dutch, after the page the person signed up on.

type Lang = 'en' | 'nl';

const DISPLAY = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const BODY = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace";
const L = { page: '#F5EEE9', text: '#191C1D', soft: '#5E5955', accent: '#B84300', fill: '#FD6002', rule: '#DCD3CC', card: '#ECE3DC' };
const D = { page: '#191C1D', text: '#F5EEE9', soft: '#AAA49F', accent: '#FD6002', rule: '#3A3F41', card: '#232829' };

const SITE = 'https://www.nevermadeoutdoorclub.com';
const INSTAGRAM = 'https://www.instagram.com/nevermadeoutdoorclub/';
const DISCORD = 'https://discord.gg/Vx2JhzGUGd';

const COPY = {
  en: {
    subject: 'You’re on the list · NEVERMADE OUTDOOR CLUB',
    kicker: 'YOU’RE ON THE LIST',
    headline: 'SEE YOU',
    accent: 'OUTSIDE.',
    intro:
      'Thanks for joining. NOC is an outdoor app for chasing your firsts: the first summit, the first night outside, the first gravel ride. Not about being the fastest. About going somewhere new.',
    testers:
      'The iPhone app is almost ready. The first 50 on the list get to test it before anyone else: if that’s you, you’ll hear from us.',
    meanwhile: 'Until then, come and say hi:',
    instagram: 'INSTAGRAM',
    instagramSub: 'What we’re building, the rides behind it',
    discord: 'DISCORD',
    discordSub: 'Plans, firsts and people to go with',
    after: 'After this, one email when the app launches. That’s it.',
    remove: (contact: string) =>
      `Signed up by mistake, or want off the list? Reply to this email or write to <a class="ac" href="mailto:${contact}" style="color:${L.accent};text-decoration:none;">${contact}</a> and we’ll delete your address.`,
    motto: 'DO THE THINGS YOU HAVEN’T DONE YET.',
  },
  nl: {
    subject: 'Je staat op de lijst · NEVERMADE OUTDOOR CLUB',
    kicker: 'JE STAAT OP DE LIJST',
    headline: 'TOT',
    accent: 'BUITEN.',
    intro:
      'Fijn dat je erbij bent. NOC is een outdoor-app voor je eerste keren: je eerste top, je eerste nacht buiten, je eerste gravelrit. Niet wie het snelst is, maar ergens nieuw heen gaan.',
    testers:
      'De iPhone-app is bijna klaar. De eerste 50 op de lijst testen hem voor iedereen: hoor jij daarbij, dan hoor je van ons.',
    meanwhile: 'Tot die tijd, kom gedag zeggen:',
    instagram: 'INSTAGRAM',
    instagramSub: 'Wat we bouwen, en de ritten erachter',
    discord: 'DISCORD',
    discordSub: 'Plannen, eerste keren en mensen om mee te gaan',
    after: 'Hierna nog één e-mail als de app uitkomt. Dat is alles.',
    remove: (contact: string) =>
      `Per ongeluk aangemeld, of wil je van de lijst? Antwoord op deze e-mail of mail <a class="ac" href="mailto:${contact}" style="color:${L.accent};text-decoration:none;">${contact}</a> en we verwijderen je adres.`,
    motto: 'DOE WAT JE NOG NOOIT HEBT GEDAAN.',
  },
} as const;

function card(href: string, title: string, sub: string): string {
  return `<td class="cd" width="50%" style="background-color:${L.card};border-radius:14px;padding:16px;vertical-align:top;">
    <a href="${href}" style="text-decoration:none;display:block;">
      <span class="ac" style="font-family:${MONO};font-size:11px;letter-spacing:2px;font-weight:500;color:${L.accent};">${title} ↗</span><br>
      <span class="sf" style="font-family:${BODY};font-size:13px;line-height:19px;color:${L.soft};">${sub}</span>
    </a>
  </td>`;
}

export function welcomeEmail(lang: Lang, contact: string): { subject: string; html: string; text: string } {
  const c = COPY[lang];
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${c.subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=IBM+Plex+Mono:wght@500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=IBM+Plex+Mono:wght@500&family=Inter:wght@400;600&display=swap');
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .bg { background-color: ${D.page} !important; }
  .cd { background-color: ${D.card} !important; }
  .tx { color: ${D.text} !important; }
  .sf { color: ${D.soft} !important; }
  .ac { color: ${D.accent} !important; }
  .rl { background-color: ${D.rule} !important; }
}
</style>
</head>
<body class="bg" style="margin:0;padding:0;background-color:${L.page};">
<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" style="background-color:${L.page};">
  <tr>
    <td class="bg" align="center" style="padding:32px 16px;background-color:${L.page};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding:0 0 28px;"><img src="${SITE}/apple-touch-icon.png" width="56" height="56" alt="NEVERMADE OUTDOOR CLUB" style="display:block;border:0;border-radius:14px;"></td></tr>
        <tr><td class="ac" style="font-family:${MONO};font-size:12px;letter-spacing:2.2px;font-weight:500;color:${L.accent};">${c.kicker}</td></tr>
        <tr><td class="tx" style="padding:8px 0 0;font-family:${DISPLAY};font-size:44px;line-height:46px;font-weight:700;color:${L.text};">${c.headline} <span class="ac" style="color:${L.accent};">${c.accent}</span></td></tr>
        <tr><td class="tx" style="padding:20px 0 0;font-family:${BODY};font-size:16px;line-height:24px;color:${L.text};">${c.intro}</td></tr>
        <tr><td class="tx" style="padding:16px 0 0;font-family:${BODY};font-size:16px;line-height:24px;color:${L.text};"><strong>${c.testers}</strong></td></tr>
        <tr><td class="sf" style="padding:28px 0 12px;font-family:${BODY};font-size:14px;line-height:20px;color:${L.soft};">${c.meanwhile}</td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${card(INSTAGRAM, c.instagram, c.instagramSub)}
            <td width="12" style="font-size:1px;line-height:1px;">&nbsp;</td>
            ${card(DISCORD, c.discord, c.discordSub)}
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 0 0;"><div class="rl" style="height:1px;background-color:${L.rule};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
        <tr><td class="tx" style="padding:20px 0 0;font-family:${BODY};font-size:14px;line-height:22px;color:${L.text};">${c.after}</td></tr>
        <tr><td class="sf" style="padding:12px 0 0;font-family:${BODY};font-size:13px;line-height:20px;color:${L.soft};">${c.remove(contact)}</td></tr>
        <tr><td class="tx" style="padding:28px 0 0;font-family:${DISPLAY};font-size:20px;line-height:22px;font-weight:700;color:${L.text};">${c.motto}</td></tr>
        <tr><td class="ac" style="padding:8px 0 0;font-family:${MONO};font-size:11px;letter-spacing:2px;font-weight:500;color:${L.accent};"><a class="ac" href="${SITE}" style="color:${L.accent};text-decoration:none;">NEVERMADEOUTDOORCLUB.COM</a></td></tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  const text = [
    c.kicker,
    `${c.headline} ${c.accent}`,
    '',
    c.intro,
    '',
    c.testers,
    '',
    `${c.meanwhile}`,
    `Instagram: ${INSTAGRAM}`,
    `Discord: ${DISCORD}`,
    '',
    c.after,
    c.remove(contact).replace(/<[^>]+>/g, ''),
    '',
    c.motto,
    SITE,
  ].join('\n');
  return { subject: c.subject, html, text };
}
