import getConfig from 'next/config'
import airtableInit from '../server/airtable'
import Sentry from '../server/sentry'

interface Fields {
  live: boolean
  text: string
  link: string
}

interface Record {
  id: string
  fields: Fields
}

export default async function latestAnnouncements(): Promise<Fields[]> {
  try {
    const records = (await getAirtable()
      .select({
        maxRecords: 1,
        filterByFormula: IS_LIVE,
        sort: [{ field: 'order', direction: 'desc' }],
      })
      .firstPage()) as Record[]

    return records.map((record) => record.fields)
  } catch (err) {
    Sentry.captureEvent(err)
  }
}

function getAirtable() {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ANNOUNCEMENT_ID)('Bluebanner')
}

const IS_LIVE = 'live=1'
