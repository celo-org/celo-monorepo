import airtableInit, { AirRecord } from '../server/airtable'

import getConfig from 'next/config'
import { EventProps } from '../fullstack/EventProps'
import Sentry from '../fullstack/sentry'

// Intermediate step Event With all String Values
interface IncomingEvent {
  link: string // url
  celoHosted: boolean
  celoSpeaking: boolean
  name: string
  description: string
  location: string // (City, Country)
  startDate: string // (MM-DD-YY)
  endDate?: string // (MM-DD-YY)
}

const REQUIRED_KEYS = ['name', 'location', 'startDate']

interface State {
  pastEvents: EventProps[]
  upcomingEvents: EventProps[]
  topEvent: EventProps | null
}

// From the airtable sheet column names
const KEY_CONVERSION = Object.freeze({
  name: 'Title',
  description: 'Description of Event',
  link: 'Event Link',
  location: 'Location (Format: City, Country)',
  celoHosted: 'Celo Hosted?',
  celoSpeaking: 'Celo Team Member Speaking?',
  startDate: 'Start Date',
  endDate: 'End Date',
})

export interface RawAirTableEvent {
  Title: string
  'Notes / Run Of Show': string
  Photos: object
  Process: 'Complete' | 'Scheduled' | 'In conversation' | 'To organize'
  Organizer: object[]
  'Event Link': string
  'Start Date': string
  'Recap Individual': {
    id: string
    email: string
    name: string
  }
  'Social Media': object[]
  'Social Media Links': string
  'Location (Format: City, Country)': string
  'Celo Team Member Speaking?': boolean
  'Description of Event': string
}

export default async function getFormattedEvents() {
  const eventData = await fetchEventsFromAirtable()
  return splitEvents(normalizeEvents(eventData as RawAirTableEvent[]))
}

function fetchEventsFromAirtable() {
  return new Promise((resolve, reject) => {
    getAirtable()
      .select({
        filterByFormula:
          'OR(Process="Complete", Process="Scheduled", Process="Conference, Speaking", Process="This Week")',
        sort: [{ field: 'Start Date', direction: 'desc' }],
      })
      .firstPage((error: unknown, records: Array<AirRecord<RawAirTableEvent>>) => {
        if (error) {
          Sentry.captureEvent(error)
          reject(error)
        } else {
          resolve(records.map((record) => record.fields))
        }
      })
  })
}

function getAirtable() {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_EVENTS_ID)('Schedule')
}

function convertKeys(rawEvent: RawAirTableEvent): IncomingEvent {
  return {
    name: rawEvent[KEY_CONVERSION.name],
    link: rawEvent[KEY_CONVERSION.link],
    celoHosted: rawEvent[KEY_CONVERSION.celoHosted],
    celoSpeaking: rawEvent[KEY_CONVERSION.celoSpeaking],
    description: rawEvent[KEY_CONVERSION.description],
    location: rawEvent[KEY_CONVERSION.location],
    startDate: rawEvent[KEY_CONVERSION.startDate],
    endDate: rawEvent[KEY_CONVERSION.endDate],
  }
}

function parseDate(date: string) {
  return new Date(date)
}

export function splitEvents(normalizedEvents: EventProps[]): State {
  const today = Date.now()

  const upcomingEvents = []
  const pastEvents = []

  normalizedEvents.forEach((event: EventProps) => {
    const willHappen = parseDate(event.startDate).valueOf() > today

    if (willHappen) {
      upcomingEvents.unshift(event)
    } else {
      pastEvents.push(event)
    }
  })
  // take first event of upcoming, if that is blank take first of past (prefer celo hosted)
  const topEvent =
    upcomingEvents
      .slice(0)
      .filter((e) => !!e.description)
      .sort(celoFirst)
      .shift() ||
    pastEvents
      .slice(0)
      .filter((e) => !!e.description)
      .sort(celoFirst)
      .shift()

  return { pastEvents, upcomingEvents, topEvent }
}

function removeEmpty(event: IncomingEvent): boolean {
  return REQUIRED_KEYS.reduce<boolean>(
    (acc, currentField) => (acc = acc && !!event[currentField]),
    true
  )
}

function convertValues(event: IncomingEvent): EventProps {
  return {
    ...event,
    celoHosted: !!event.celoHosted,
    celoSpeaking: !!event.celoSpeaking,
  }
}

function orderByDate(eventA: EventProps, eventB: EventProps) {
  return eventA.startDate === eventB.startDate ? 0 : eventA.startDate > eventB.startDate ? -1 : 1
}

export function celoFirst(eventA: EventProps, eventB: EventProps) {
  if (eventA.celoHosted && eventB.celoHosted) {
    return eventA.startDate > eventB.startDate ? 1 : -1
  } else if (eventA.celoHosted) {
    return -1
  } else if (!eventA.celoHosted && !eventB.celoHosted) {
    return 0
  } else {
    return 1
  }
}

export function normalizeEvents(data: RawAirTableEvent[]): EventProps[] {
  return data
    .map(convertKeys)
    .filter(removeEmpty)
    .map(convertValues)
    .sort(orderByDate)
}
