import getConfig from 'next/config'
import { PressArticleFields } from 'src/press/PressPage'
import airtableInit from './airtable'
import cache from './cache'

async function fetchPress() {
  const records = (await getAirtable()
    .select({ sort: [{ field: 'date', direction: 'desc' }] })
    .firstPage()) as Record[]
  return records
}

export default async function getMilestones() {
  const releases = await cache('celo-press', fetchPress)
  return releases.map(({ fields }) => fields)
}

function getAirtable() {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ANNOUNCEMENT_ID)('Press')
}

interface Record {
  id: string
  fields: PressArticleFields
}
