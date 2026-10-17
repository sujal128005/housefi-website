// Page copy. The customer journey and the trust features follow the Housefi app as it is built today; nothing here
// states prices, customer numbers, ratings, coverage areas, certifications or guarantees.

export const hero = {
  eyebrow: 'Home services, in one app',
  title: ['Your Home.', 'Our Responsibility.'],
  lead: 'Thoughtful home care, made simple.',
  primaryCta: 'Get the app',
  secondaryCta: 'See our services',
}

export const journey = {
  heading: 'Every fix your home needs.',
  sub: 'Six kinds of help. One app to book them.',
  glass: { title: 'Nothing hidden.', body: 'You see the quote and approve it before any work starts.' },
  done: { title: 'Job done.', body: 'Every visit ends with a clear record in the app.' },
}

/** How Housefi works: the customer journey in the app (screens from the app's own walkthrough). */
export const steps = [
  {
    title: 'Tell us what is wrong',
    body: 'Pick a service, or snap a photo, record a voice note or type a few words. The app helps you find the right kind of help.',
    art: '/illustrations/camera.webp',
    screen: '/screens/app-home.webp',
  },
  {
    title: 'Choose when',
    body: 'Ask for someone now, or pick a day and a time slot that suits you.',
    art: '/illustrations/spiral_calendar.webp',
    screen: '/screens/app-when.webp',
  },
  {
    title: 'Meet your technician',
    body: 'See who is coming and follow them on the way. Share your arrival code only when they are at your door.',
    art: '/illustrations/scooter.webp',
    screen: '/screens/app-on-the-way.webp',
  },
  {
    title: 'Approve the quote first',
    body: 'After a look at the problem, the technician sends a quote to your phone. Work starts only when you say yes.',
    art: '/illustrations/clipboard.webp',
    screen: '/screens/app-quote.webp',
  },
  {
    title: 'Pay and rate',
    body: 'When the job is done, pay in the app and tell us how it went.',
    art: '/illustrations/star.webp',
    screen: '/screens/app-rate.webp',
  },
] as const

export const why = {
  statement: 'A home runs on small things working. When one of them breaks, getting help should feel calm, clear and simple.',
  cards: [
    {
      title: 'You approve before any work',
      body: 'The quote comes to your phone first. Nothing starts until you agree.',
      art: '/illustrations/check.webp',
      size: 'wide',
    },
    {
      title: 'Know who is at your door',
      body: 'Each technician has a Housefi ID card with a QR code you can check.',
      art: '/illustrations/verify_ok.webp',
      size: 'tall',
    },
    {
      title: 'A code for the door',
      body: 'A 4-digit arrival code, shared only when your technician arrives.',
      art: '/illustrations/start_code.webp',
      size: 'small',
    },
    {
      title: 'English and Telugu',
      body: 'Use the app in the language you are most comfortable with.',
      art: '/illustrations/globe.webp',
      size: 'small',
    },
    {
      title: 'Updates as it happens',
      body: 'From "assigned" to "on the way" to "done", the app keeps you posted.',
      art: '/illustrations/bell.webp',
      size: 'wide',
    },
  ],
} as const

export const app = {
  title: 'The whole visit lives in the app.',
  body: 'Booking, tracking, quotes, payment and your history are all in the Housefi app. This website introduces Housefi; the app is where the help happens.',
  points: ['Book in a few taps', 'Follow your technician', 'Approve quotes', 'Pay and keep receipts'],
  note: 'App screens shown are from the current preview build.',
}

export const about = {
  title: 'Built for the way homes really work.',
  paragraphs: [
    'Housefi is a home-services platform with two sides in one app: one for people who need help at home, and one for the technicians who provide it.',
    'Our aim is simple: make getting a repair as calm as booking a ride. Clear steps, clear prices before work, and a person you can verify at the door.',
  ],
}

export const faq = [
  {
    q: 'What is Housefi?',
    a: 'Housefi is an app for booking help at home: plumbing, electrical, AC repair, appliances, cleaning and carpentry.',
  },
  {
    q: 'How do I book?',
    a: 'Download the Housefi app, describe the problem, pick a time and confirm. Bookings are made in the app, not on this website.',
  },
  {
    q: 'When do I find out the price of the repair?',
    a: 'After the technician has looked at the problem, they send a quote to the app. Work starts only after you approve it.',
  },
  {
    q: 'How do I know who is coming?',
    a: 'The app shows your technician before they arrive, and their Housefi ID card can be checked with its QR code.',
  },
  {
    q: 'Which languages does the app support?',
    a: 'English and Telugu.',
  },
  {
    q: 'Where is Housefi available?',
    a: 'Service areas will be announced at launch. Follow us or check back here for updates.',
  },
] as const
