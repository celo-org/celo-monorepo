import getConfig from 'next/config'
import airtableInit from '../server/airtable'

export default function latest() {
  return new Promise((resolve, reject) => {
    getAirtable()
      .select({
        maxRecords: 1,
        filterByFormula: IS_LIVE,
        sort: [{ field: 'order', direction: 'desc' }],
      })
      .firstPage((err, records) => {
        if (err) {
          reject(err)
          return
        }
        console.log(records)
        resolve(records.map((record) => record.fields))
      })
  })
}

function getAirtable() {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ANNOUNCEMENT_ID)('Bluebanner')
}

const IS_LIVE = 'live=1'
