import getConfig from 'next/config'
import { FellowApp, FellowKeys } from '../fullstack/Fellowship'
import airtableInit, { AirRecord } from '../server/airtable'
const TABLE_NAME = 'Fellowship Application'

function getAirtable() {
  const { serverRuntimeConfig } = getConfig()
  return airtableInit(serverRuntimeConfig.AIRTABLE_FELLOW_ID)(TABLE_NAME)
}

export async function submitFellowApp(fields: FellowApp) {
  return (getAirtable().create(migrate(fields)) as unknown) as Promise<AirRecord<FellowApp>>
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
