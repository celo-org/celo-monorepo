const AirtableAPI = require('airtable')
import getConfig from 'next/config'
import { EcoFundKeys, EcuFundFields } from '../fullstack/EcoFundFields'

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

function migrate(fields: EcoFundKeys) {
  return {
    [EcuFundFields.name]: fields.name,
    [EcuFundFields.email]: fields.email,
    [EcuFundFields.ideas]: fields.ideas,
    [EcuFundFields.deliverables]: fields.deliverables,
    [EcuFundFields.bio]: fields.bio,
    [EcuFundFields.resume]: fields.resume,
  }
}
