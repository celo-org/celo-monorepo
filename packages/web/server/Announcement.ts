import getConfig from 'next/config'
import Sentry from '../fullstack/sentry'
import airtableInit from '../server/airtable'

interface Fields {
  live: boolean
  text: string
  link: string
}

interface QueryError {
  message: string
  error: number
}

export default function latestAnnouncements(): Promise<Fields[]> {
  return new Promise((resolve, reject) => {
    getAirtable()
      .select({
        maxRecords: 1,
        filterByFormula: IS_LIVE,
        sort: [{ field: 'order', direction: 'desc' }],
      })
      .firstPage((err: QueryError, records: Airtable.Response<Fields>) => {
        if (err) {
          Sentry.captureEvent(err)
          reject(err)
          return
        }
        resolve(records.map((record) => record.fields))
      })
  })
}

function getAirtable() {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ANNOUNCEMENT_ID)('Bluebanner')
}

const IS_LIVE = 'live=1'
