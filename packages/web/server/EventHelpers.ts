// App crashes when these are imports instead of requires, now that the code is serverside
const fecha = require('fecha')
const Tabletop = require('tabletop')

import getConfig from 'next/config'
import { EventProps } from '../fullstack/EventProps'
import Sentry from '../fullstack/sentry'
import { abort } from '../src/utils/abortableFetch'

// Intermediate step Event With all String Values
interface IncomingEvent {
  link: string // url
  celoHosted: string // 'TRUE' | 'FALSE'
  celoAttending: string // 'TRUE' | 'FALSE'
  celoSpeaking: string // 'TRUE' | 'FALSE'
  name: string
  description: string
  location: string // (City, Country)
  startDate: string // (MM-DD-YY)
  endDate?: string // (MM-DD-YY)
  recap?: string // text
}

const REQUIRED_KEYS = ['link', 'celoHosted', 'name', 'description', 'location', 'startDate']

interface State {
  pastEvents: EventProps[]
  upcomingEvents: EventProps[]
  topEvent: EventProps | null
}

// From the google sheet column names
const KEY_CONVERSION = Object.freeze({
  name: 'Name (string)',
  description: 'Description (string)',
  link: 'Link (url)',
  location: 'Location (City, Country)',
  celoHosted: 'Celo Hosted (True/False)',
  celoAttending: 'Celo Attending (True/False)',
  celoSpeaking: 'Celo Speaking (True/False)',
  startDate: 'Start Date (MM-DD-YY)',
  endDate: 'End Date (MM-DD-YY)',
  recap: 'Recap (url)',
})

type RawEvent = Record<string, string>

function getURL() {
  return getConfig().serverRuntimeConfig.EVENTS_SHEET_URL
}

export default async function getFormattedEvents() {
  const eventData = await intializeTableTop()
  return splitEvents(normalizeEvents(eventData as RawEvent[]))
}

export function intializeTableTop() {
  const promise = new Promise<RawEvent[]>((resolve) => {
    const callback = (data: RawEvent[]) => {
      resolve(data)
    }
    try {
      Tabletop.init({
        key: getURL(),
        callback,
        simpleSheet: true,
      })
    } catch (e) {
      resolve([])
      Sentry.withScope((scope) => {
        scope.setTag('Service', 'GoogleSheets')
        Sentry.captureException(e)
      })
    }
  })
  return Promise.race([promise, abort(getURL(), 3000).catch(() => [])])
}

function convertKeys(rawEvent: RawEvent): IncomingEvent {
  return {
    name: rawEvent[KEY_CONVERSION.name],
    link: rawEvent[KEY_CONVERSION.link],
    celoHosted: rawEvent[KEY_CONVERSION.celoHosted],
    celoAttending: rawEvent[KEY_CONVERSION.celoAttending],
    celoSpeaking: rawEvent[KEY_CONVERSION.celoSpeaking],
    description: rawEvent[KEY_CONVERSION.description],
    location: rawEvent[KEY_CONVERSION.location],
    startDate: rawEvent[KEY_CONVERSION.startDate],
    endDate: rawEvent[KEY_CONVERSION.endDate],
    recap: rawEvent[KEY_CONVERSION.recap],
  }
}

function parseDate(date: string) {
  return fecha.parse(date, 'MM-DD-YY')
}

function convertValues(event: IncomingEvent): EventProps {
  return {
    ...event,
    celoHosted: event.celoHosted === 'TRUE',
    celoSpeaking: event.celoSpeaking === 'TRUE',
    celoAttending: event.celoAttending === 'TRUE',
    startDate: event.startDate,
    endDate: event.endDate,
  }
}

export function splitEvents(normalizedEvents): State {
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
  const topEvent = upcomingEvents.sort(celoFirst).shift() || pastEvents.sort(celoFirst).shift()

  return { pastEvents, upcomingEvents, topEvent }
}

function removeEmpty(event: IncomingEvent): boolean {
  return REQUIRED_KEYS.reduce<boolean>(
    (acc, cv) => (acc = acc && !!(event[cv] && event[cv].length)),
    true
  )
}

function orderByDate(eventA: EventProps, eventB: EventProps) {
  return parseDate(eventA.startDate).valueOf() > parseDate(eventB.startDate).valueOf() ? -1 : 1
}

function celoFirst(eventA: EventProps, eventB: EventProps) {
  return eventA.celoHosted === eventB.celoHosted ? 0 : eventA.celoHosted ? -1 : 1
}

export function normalizeEvents(data: RawEvent[]) {
  return data
    .map(convertKeys)
    .filter(removeEmpty)
    .map(convertValues)
    .sort(orderByDate)
}
