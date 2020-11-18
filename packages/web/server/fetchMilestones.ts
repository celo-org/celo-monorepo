import getConfig from 'next/config'
import { Status } from 'src/home/roadmap/milestones'
import airtableInit from './airtable'
import cache from './cache'

async function fetchMilestones() {
  const records = (await getAirtable()
    .select({ sort: [{ field: 'Order', direction: 'desc' }] })
    .firstPage()) as Record[]
  return records.map((record) => convert(record.fields))
}

export default async function getMilestones() {
  return cache('celo-milestones', fetchMilestones)
}

function getAirtable() {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ANNOUNCEMENT_ID)('Timeline')
}

interface Fields {
  Date?: string
  Text: string
  Title: string
  Status: string
}

interface Record {
  id: string
  fields: Fields
}

function convert(fields: Fields) {
  return {
    date: fields.Date,
    title: fields.Title,
    text: fields.Text,
    status: convertStatus(fields.Status),
  }
}

function convertStatus(string: string): Status {
  switch (string) {
    case 'Complete':
      return Status.complete
    case 'Pending':
      return Status.unstarted
    case 'InProgress':
      return Status.inprogress
  }
}
