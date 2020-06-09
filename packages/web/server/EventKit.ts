import { Attachment, FieldSet, Table } from 'airtable'
import airtableInit from './airtable'
import cache from './cache'

const AIRTABLE_BASE_ID = 'appjKfoHvrO5SZWdd'

interface Fields extends FieldSet {
  Name: string
  Preview: Attachment[]
  Terms: boolean
  Tags?: string[]
  Order: number
  Location: string
}

export enum Sheets {
  Planning = 'Planning',
}

export default async function getAssets(sheet: Sheets) {
  return cache(`exp-events-${sheet}`, fetchAssets, { args: sheet, minutes: 10 })
}

async function fetchAssets(sheet: Sheets) {
  const assets = []

  await getAirtable(sheet)
    .select({
      pageSize: 100,
      filterByFormula: `${TERMS_SIGNED}`,
      sort: [{ field: 'Order', direction: 'asc' }],
    })
    .eachPage((records, fetchNextPage) => {
      records.forEach((doc) => assets.push(normalize(doc.fields, doc.id)))
      fetchNextPage()
    })
  return assets
}

function getAirtable(sheet: Sheets): Table<Fields> {
  return airtableInit(AIRTABLE_BASE_ID)(sheet) as Table<Fields>
}

const TERMS_SIGNED = 'Terms=1'

function normalize(asset: Fields, id: string) {
  return {
    title: asset.Name,
    preview: getPreview(asset),
    uri: getURI(asset),
    id,
  }
}
export const _normalize = normalize

function getPreview(asset: Fields) {
  const previewField = asset.Preview

  return (
    (previewField &&
      previewField[0] &&
      previewField[0].thumbnails &&
      previewField[0].thumbnails.large.url) ||
    ''
  )
}

function getURI(asset: Fields) {
  return asset.Location
}
