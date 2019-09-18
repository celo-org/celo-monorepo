import Airtable from 'airtable'
import getConfig from 'next/config'

let airTableSingleton

export default function airtableInit(baseID: string) {
  const { serverRuntimeConfig } = getConfig()

  if (!airTableSingleton) {
    airTableSingleton = new Airtable({ apiKey: serverRuntimeConfig.AIRTABLE_API_KEY })
  }
  return airTableSingleton.base(baseID)
}
