// The six service categories, matching the Housefi app's catalogue (src/data/catalog.ts in the app repository).
// `examples` are the app's own category taglines. Illustrations are Housefi's soft-3D tiles from the app.

export type ServiceId = 'plumbing' | 'electrical' | 'ac' | 'appliances' | 'cleaning' | 'carpentry'

export interface Service {
  readonly id: ServiceId
  readonly name: string
  readonly examples: string
  readonly description: string
  readonly art: string
  /** Accent used for glows and highlights. */
  readonly accent: string
}

export const services: readonly Service[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    examples: 'Taps, leaks, drains',
    description: 'Dripping taps, leaking pipes and slow drains, looked at by someone who knows water.',
    art: '/illustrations/svc_tap.webp',
    accent: '#48D9F5',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    examples: 'Fans, switches, wiring',
    description: 'Switches that spark, lights that flicker and fans that stop. Fixed carefully, with the power off.',
    art: '/illustrations/bulb.webp',
    accent: '#FFC857',
  },
  {
    id: 'ac',
    name: 'AC Repair',
    examples: 'Service, repair, install',
    description: 'Cooling that has faded, water dripping indoors or a unit that will not start.',
    art: '/illustrations/svc_ac.webp',
    accent: '#48D9F5',
  },
  {
    id: 'appliances',
    name: 'Appliances',
    examples: 'Washer, fridge, RO',
    description: 'Washing machines, fridges and water purifiers, back to doing their job.',
    art: '/illustrations/svc_washer.webp',
    accent: '#2455F5',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    examples: 'Bathroom, kitchen, sofa',
    description: 'Deep cleaning for the rooms that work hardest: bathroom, kitchen and sofa.',
    art: '/illustrations/sponge.webp',
    accent: '#FF8A35',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    examples: 'Doors, locks, furniture',
    description: 'Doors that stick, locks that jam and furniture that needs a steady hand.',
    art: '/illustrations/saw.webp',
    accent: '#FF8A35',
  },
]
