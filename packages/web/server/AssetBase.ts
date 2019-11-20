import { Attachment, FieldSet, Table } from 'airtable'
import getConfig from 'next/config'
import airtableInit from './airtable'

interface Fields extends FieldSet {
  Name: string
  Description: string
  Assets: Attachment[]
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
      // filterByFormula: IS_LIVE,
      // sort: [{ field: 'name', direction: 'desc' }],})
    })
    .all()
    .then((records) => {
      console.log(records)
      return records.map((r) => r.fields)
    })
}

function getAirtable(sheet: AssetSheet): Table<Fields> {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_BRANDKIT_ID)(sheet)
}

// const IS_LIVE = 'approved=1'
