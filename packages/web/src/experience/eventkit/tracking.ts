import analytics from 'src/analytics/analytics'
export enum Types {
  PlanningDoc,
  Action,
}

interface Tracker {
  name: string
  type: Types
}

export async function trackDownload({ name, type }: Tracker) {
  await analytics.track(`${name} Downloaded`, `event-kit: ${type}`)
}

export async function trackOpen({ name, type }: Tracker) {
  await analytics.track(`${name} Open`, `event-kit: ${type}`)
}
