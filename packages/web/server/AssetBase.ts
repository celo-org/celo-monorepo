import { Attachment, FieldSet, Table } from 'airtable'
import getConfig from 'next/config'
import cache from '../server/cache'
import airtableInit from './airtable'

const ASSSET_FIELD_LIGHT = 'Assets (on light bg)'
const ASSSET_FIELD_DARK = 'Assets (on dark bg)'

interface Fields extends FieldSet {
  Name: string
  Description: string
  [ASSSET_FIELD_LIGHT]: Attachment[]
  [ASSSET_FIELD_DARK]: Attachment[]
  Zip: Attachment[]
  Terms: boolean
  Tags: string[]
}

enum AssetSheet {
  Icons = 'Icons',
  Illustrations = 'Illustrations',
  AbstractGraphics = 'Abstract Graphics',
}

export default async function getAssets(sheet: AssetSheet) {
  return cache(`brand-assets-${sheet}`, fetchAssets, { args: sheet, minutes: 10 })
}

function fetchAssets(sheet: AssetSheet) {
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
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_BRANDKIT_ID)(sheet) as Table<Fields>
}

const IS_APROVED = 'Approved=1'
const TERMS_SIGNED = 'Terms=1'

function normalize(asset: Fields) {
  return {
    name: asset.Name,
    description: asset.Description,
    preview: getPreview(asset),
    uri: getURI(asset),
  }
}

function getPreview(asset: Fields) {
  const previewField = asset[ASSSET_FIELD_LIGHT]

  return (
    (previewField &&
      previewField[0] &&
      previewField[0].thumbnails &&
      previewField[0].thumbnails.large.url) ||
    ''
  )
}

function getURI(asset: Fields) {
  return (asset.Zip && asset.Zip[0] && asset.Zip[0].url) || ''
}
