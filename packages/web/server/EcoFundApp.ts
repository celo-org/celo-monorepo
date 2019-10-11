import getConfig from 'next/config'
import { Application, Recommendation, Tables } from '../fullstack/EcoFundFields'
import airtableInit from '../server/airtable'

export default function submit(fields: Recommendation | Application, table: Tables) {
  switch (table) {
    case Tables.Applicants:
      return apply(fields as Application)
    case Tables.Recommendations:
      return recommend(fields as Recommendation)
    default:
      return Promise.reject({ message: `Invalid Table ${table}` })
  }
}

function getAirtable(tableName: Tables) {
  const { serverRuntimeConfig } = getConfig()
  return airtableInit(serverRuntimeConfig.AIRTABLE_ECOFUND_ID)(tableName)
}

async function recommend(fields: Recommendation) {
  return getAirtable(Tables.Recommendations).create(fields)
}

async function apply(fields: Application) {
  return getAirtable(Tables.Applicants).create(fields)
}
