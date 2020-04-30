import fetch from 'cross-fetch'
import getConfig from 'next/config'
import Sentry from '../server/sentry'
interface ActiveCampaignNewContact {
  email: string
  firstName: string
  lastName: string
  deleted: boolean
  orgid?: string
  phone?: string
}
interface ActiveCampaignFullContact {
  contact: {
    email: string
    phone: string
    firstName: string
    lastName: string
    orgid: string
    ip: string
    ua: string
    hash: string
    deleted: string
    anonymized: string
    deleted_at: string // "0000-00-00 00:00:00",
    created_utc_timestamp: string // "2018-09-28 17:27:21",
    updated_utc_timestamp: string // "2018-09-28 17:27:21",
    links: any
    id: string
    organization: string | null
  }
}
type ActiveCampaignID = number
interface ActiveCampaignListStatus {
  list: ActiveCampaignID // List ID
  contact: ActiveCampaignID // Contact ID
  status: ListStatus
}

enum ListStatus {
  subscribe = 1,
  unsubscribe = 2,
}

interface ActiveCampaignFieldValueParam {
  contact: ActiveCampaignID
  field: ActiveCampaignID
  value: string
}

interface CRMInterface {
  email: string
  fullName: string
  company?: string
  role?: string
  interest?: string
  list?: number
}

interface CreationError {
  error: string
}

function apiKey() {
  const { serverRuntimeConfig } = getConfig()
  return serverRuntimeConfig.__ACTIVE_CAMPAIGN_API_KEY__
}

const BASE_URL = 'https://celo.api-us1.com/api/3'

async function upsertContact(
  contact: ActiveCampaignNewContact
): Promise<ActiveCampaignFullContact> {
  const response = await fetch(`${BASE_URL}/contact/sync`, buildRequest({ contact }))
  return processResponse(response)
}

async function addToList(contactList: ActiveCampaignListStatus) {
  const response = await fetch(`${BASE_URL}/contactLists`, buildRequest({ contactList }))
  return processResponse(response)
}

async function createContactFieldValue(fieldValue: ActiveCampaignFieldValueParam) {
  const response = await fetch(`${BASE_URL}/fieldValues`, buildRequest({ fieldValue }))
  return processResponse(response)
}

// Fetch helpers
async function processResponse(response: Response) {
  if (response.ok) {
    const json = await response.json()
    return json
  }
  const error = await response.json()
  throw { status: response.statusText, error: error.errors }
}

function buildRequest(body: object) {
  return {
    headers: {
      'Api-Token': apiKey(),
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body),
  }
}
// end fetch helpers

function convert(formContact: CRMInterface): ActiveCampaignNewContact {
  const [firstName, ...restNames] = formContact.fullName.split(' ')
  const lastName = restNames.join(' ')
  return {
    email: formContact.email,
    firstName,
    lastName,
    deleted: false,
  }
}

// from https://celo.api-us1.com/api/3/fields
const CUSTOM_FIELD_IDS = {
  interest: 16,
  company: 12,
  role: 4,
  source: 1,
}
async function setCustomFields(contactID: ActiveCampaignID, fields) {
  await Promise.all(
    Object.keys(fields).map(async (key) => {
      const value = fields[key]
      if (value) {
        await createContactFieldValue({
          contact: contactID,
          field: CUSTOM_FIELD_IDS[key],
          value,
        })
      }
    })
  )
}

const NEWSLETTER_LIST = 1

export default async function addToCRM({
  email,
  fullName,
  interest,
  company,
  role,
  list = NEWSLETTER_LIST,
}: CRMInterface): Promise<ActiveCampaignFullContact | CreationError> {
  const preparedContact = convert({ email, fullName })

  try {
    const contact = await upsertContact(preparedContact)
    const contactID = Number(contact.contact.id)

    await Promise.all([
      addToList({ contact: contactID, list, status: ListStatus.subscribe }),
      setCustomFields(contactID, { interest, company, role, source: 'website' }),
    ])

    return contact
  } catch (e) {
    Sentry.withScope((scope) => {
      scope.setTag('Service', 'ActiveCampaign')
      Sentry.captureEvent({ message: e.toString(), extra: { status: e.status } })
    })
    return { error: e }
  }
}
