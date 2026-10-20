// Words for the "Become a Housefi technician" page (/technicians/). Plain and honest: no pay figures or counts here,
// because pay rates can change; technicians see what each job pays in the app before they accept it.

export const joinHero = {
  eyebrow: 'For technicians in Hyderabad',
  title: 'Get repair jobs near you.',
  lead: 'Plumbers, electricians, AC and appliance technicians, cleaners and carpenters: join Housefi, go online when you want to work, and get jobs from homes close to you.',
}

export const joinSteps = [
  { art: '/illustrations/globe.webp', title: 'Download the Housefi app', body: 'Open it and choose "I\'m a technician". Sign in with your mobile number and the code we send by SMS.' },
  { art: '/illustrations/clipboard.webp', title: 'Tell us about your work', body: 'Your name as on Aadhaar, the trades you do, the areas you cover and your vehicle. Add a clear photo of your face.' },
  { art: '/illustrations/verify_ok.webp', title: 'Scan your Aadhaar QR', body: 'Scan the QR code on your Aadhaar card in the app. It is checked offline; Housefi keeps only the last 4 digits.' },
  { art: '/illustrations/check.webp', title: 'Get approved, go online', body: 'When your details check out you are approved automatically. Go online and job offers start coming.' },
] as const

export const joinBenefits = [
  { art: '/illustrations/scooter.webp', title: 'Jobs close to you', body: 'Offers come from homes near where you are, so less time on the road and more time working.' },
  { art: '/illustrations/spiral_calendar.webp', title: 'Work when you want', body: 'Go online when you are free and offline when you are not. Accept the jobs you want.' },
  { art: '/illustrations/clipboard.webp', title: 'See the pay before you accept', body: 'Every offer shows what you earn for the visit. Your repair quote, approved by the customer, adds your share of labour and the parts you fit.' },
  { art: '/illustrations/bell.webp', title: 'Paid every week', body: 'Earnings are paid out every Monday to your bank account or UPI. Cash you collect is adjusted in the same payout.' },
  { art: '/illustrations/verify_ok.webp', title: 'A verified ID card', body: 'Your digital Housefi ID card has a QR code customers can scan to see you are verified, which builds trust at the door.' },
  { art: '/illustrations/start_code.webp', title: 'Safe and supported', body: 'The customer shares a start code at the door, an SOS button reaches the Housefi team, and chat and calls work inside the app.' },
] as const

export const joinNeeds = [
  'You are 18 or older and work in Hyderabad',
  'Your Aadhaar card (with its QR code)',
  'An Android phone or iPhone with mobile data',
  'Your own tools for your trade',
] as const

export const joinFaq = [
  { q: 'Is there a fee to join?', a: 'No. Joining Housefi and using the technician app is free.' },
  { q: 'Which trades can join?', a: 'Plumbing, electrical, AC repair, appliances, cleaning and carpentry. You can pick more than one, for example electrical and AC.' },
  { q: 'How long does approval take?', a: 'The app shows you when your review will finish. Most profiles whose Aadhaar and details check out are approved automatically within that time.' },
  { q: 'How do quotes work?', a: 'After checking the problem you send a quote in the app: labour and parts. Parts from Housefi\'s price list are pre-filled at fair prices. The customer approves it before you start.' },
  { q: 'When do I get paid?', a: 'Every Monday, for the week before, to your bank account or UPI. The Earnings tab shows every job and every payout.' },
] as const
