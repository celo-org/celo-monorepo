import { Attachment, FieldSet, Table } from 'airtable'
import getConfig from 'next/config'
import airtableInit, { getImageURI, ImageSizes } from './airtable'
import { cache } from './cache'

interface AllianceMember {}

enum Category {
  'Send' = 'Send',
  'Lend' = 'Lend',
  'Earn' = 'Earn',
  'Pay' = 'Pay',
  'Save' = 'Save',
  'Give' = 'Give',
  'Educate' = 'Educate',
  'Validate' = 'Validate',
  'Invest' = 'Invest',
  'Build' = 'Build',
  'Secure' = 'Secure',
}

const CATEGORY_FIELD = 'Web Category*'
const LOGO_FIELD = 'Logo Upload'
const URL_FIELD = 'Company URL*'

interface Fields extends FieldSet {
  Name: string
  Approved: boolean
  [URL_FIELD]: string
  [CATEGORY_FIELD]: Category[]
  [LOGO_FIELD]: Attachment[]
}

const SHEET = 'MOU Tracking'

export default async function getAllies() {
  return Promise.all(
    Object.keys(Category).map((category) => {
      return cache(`air-${SHEET}-${category}`, fetchAllies, { args: category })
    })
  )
}

async function fetchAllies(category: Category) {
  return getAirtable(SHEET)
    .select({
      filterByFormula: `AND(${IS_APROVED},SEARCH("${category}", {${CATEGORY_FIELD}}))`,
      fields: ['Name', 'Approved', CATEGORY_FIELD, LOGO_FIELD],
      view: 'Alliance Web',
    })
    .all()
    .then((records) => {
      return { category, records: records.map((r) => normalize(r.fields)) }
    })
}

function getAirtable(sheet: string) {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ALLIANCE_ID)(sheet) as Table<Fields>
}

const IS_APROVED = 'Approved=1'

function normalize(asset: Fields): AllianceMember {
  return {
    name: asset.Name,
    logo: getImageURI(asset['Logo Upload'], ImageSizes.large),
    url: asset[URL_FIELD],
    categories: asset[CATEGORY_FIELD],
  }
}
