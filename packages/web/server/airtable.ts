const AirtableAPI = require('airtable')
import getConfig from 'next/config'

let airTableSingleton

export default function getAirtable(appName: string) {
  const { serverRuntimeConfig } = getConfig()

  if (!airTableSingleton) {
    airTableSingleton = new AirtableAPI({ apiKey: serverRuntimeConfig.AIRTABLE_API_KEY }).base(
      serverRuntimeConfig.AIRTABLE_APP_ID
    )
  }
  return airTableSingleton(appName)
}
