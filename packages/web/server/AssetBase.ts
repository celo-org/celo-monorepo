import { Attachment, FieldSet, Table } from 'airtable'
import getConfig from 'next/config'
import airtableInit from './airtable'

const ASSSET_FIELD_LIGHT = 'Assets (on light bg)'
const ASSSET_FIELD_DARK = 'Assets (on dark bg)'

interface Fields extends FieldSet {
  Name: string
  Description: string
  [ASSSET_FIELD_LIGHT]: Attachment[]
  [ASSSET_FIELD_DARK]: Attachment[]
  Terms: boolean
  Tags: string[]
}

// interface QueryError {
//   message: string
//   error: number
// }

enum AssetSheet {
  Icons = 'Icons',
  Illustrations = 'Illustrations',
  AbstractGraphics = 'Abstract Graphics',
}

export default function getAssets(sheet: AssetSheet) {
  return getAirtable(sheet)
    .select({
      filterByFormula: `AND(${IS_APROVED}, ${TERMS_SIGNED})`,
      sort: [{ field: 'Name', direction: 'desc' }],
    })
    .all()
    .then((records) => {
      return records.map((r) => normalize(r.fields))
    })
}

function getAirtable(sheet: AssetSheet): Table<Fields> {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_BRANDKIT_ID)(sheet)
}

const IS_APROVED = 'Approved=1'
const TERMS_SIGNED = 'TERMS=1'

function normalize(asset: Fields) {
  return {
    name: asset.Name,
    description: asset.Description,
    preview: asset[ASSSET_FIELD_LIGHT][0].thumbnails.large.url,
    uri: asset[ASSSET_FIELD_LIGHT][0].url,
  }
}
