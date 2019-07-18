const AirtableAPI = require('airtable')
import getConfig from 'next/config'
import { FellowApp, FellowKeys } from '../fullstack/Fellowship'

const APP_NAME = 'Fellowship Application'

let airTableSingleton

function getAirtable() {
  const { serverRuntimeConfig } = getConfig()

  if (!airTableSingleton) {
    airTableSingleton = new AirtableAPI({ apiKey: serverRuntimeConfig.AIRTABLE_API_KEY }).base(
      serverRuntimeConfig.AIRTABLE_APP_ID
    )(APP_NAME)
  }

  return airTableSingleton
}

export async function submitFellowApp(fields: FellowApp) {
  try {
    await getAirtable().create(migrate(fields))
  } catch {
    return []
  }
}

function migrate(fields: FellowApp) {
  return {
    [FellowKeys.name]: fields.name,
    [FellowKeys.email]: fields.email,
    [FellowKeys.ideas]: fields.ideas,
    [FellowKeys.deliverables]: fields.deliverables,
    [FellowKeys.bio]: fields.bio,
    [FellowKeys.resume]: fields.resume,
  }
}
