import getConfig from 'next/config'
import {
  Application,
  // ApplicationFields,
  Recommendation,
  RecommendationFields,
  Tables,
} from '../fullstack/EcoFundFields'
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

export async function recommend(fields: Recommendation) {
  return getAirtable(Tables.Recommendations).create(migrateRecomentation(fields))
}

export async function apply(fields: Application) {
  return getAirtable(Tables.Applicants).create(fields)
}

function migrateRecomentation(fields: Recommendation) {
  return {
    [RecommendationFields.orgName]: fields.orgName,
  }
}

// function migrationApplication(fields: Application) {
//   return {
//     [ApplicationFields.about]: fields.about,
//     [ApplicationFields.org]: fields.org,
//     [ApplicationFields.product]: fields.product,
//     [ApplicationFields.url]: fields.url,
//     [ApplicationFields.founderEmail]: fields.founderEmail,
//     [ApplicationFields.coFounderEmail]: fields.coFounderEmail,
//     [ApplicationFields.video]: fields.video,
//   }
// }
