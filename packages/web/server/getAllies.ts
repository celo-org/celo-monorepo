import { Attachment, FieldSet, Table } from 'airtable'
import getConfig from 'next/config'
import Ally from 'src/alliance/AllianceMember'
import { Category } from 'src/alliance/CategoryEnum'
import airtableInit, { getImageRatio, getImageURI, ImageSizes } from './airtable'
import { cache } from './cache'

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
      fields: ['Name', 'Approved', CATEGORY_FIELD, LOGO_FIELD, URL_FIELD],
      view: 'Alliance Web',
    })
    .all()
    .then((records) => {
      return { name: category, records: records.map((r) => normalize(r.fields)) }
    })
}

function getAirtable(sheet: string) {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ALLIANCE_ID)(sheet) as Table<Fields>
}

const IS_APROVED = 'Approved=1'

function normalize(asset: Fields): Ally {
  return {
    name: asset.Name,
    logo: {
      uri: getImageURI(asset['Logo Upload'], ImageSizes.large),
      ratio: getImageRatio(asset['Logo Upload']),
    },
    url: asset[URL_FIELD],
  }
}
