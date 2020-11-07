import AirtableAPI, { Attachment } from 'airtable'
import getConfig from 'next/config'

let airTableSingleton: AirtableAPI

export default function airtableInit(baseID: string) {
  const { serverRuntimeConfig } = getConfig()

  if (!airTableSingleton) {
    airTableSingleton = new AirtableAPI({ apiKey: serverRuntimeConfig.AIRTABLE_API_KEY })
  }
  return airTableSingleton.base(baseID)
}

export interface AirRecord<Fields> {
  id: string
  fields: Fields
  save: () => unknown
  patchUpdate: () => unknown
  putUpdate: () => unknown
  destroy: () => unknown
  fetch: () => unknown
  updateFields: () => unknown
  replaceFields: () => unknown
  _rawJson: {
    id: string
    fields: Fields
    createdTime: string
  }
  _table: AirtableAPI.Table<AirtableAPI.FieldSet>
}

export enum ImageSizes {
  large = 'large',
  small = 'small',
}

export function getImageURI(previewField: Attachment[], size: ImageSizes) {
  const thumb = getThumbnail(previewField, size)
  return thumb ? thumb.url : ''
}

export function getWidthAndHeight(imageField: Attachment[]) {
  const thumb = getThumbnail(imageField, ImageSizes.large)
  return thumb ? { width: thumb.width, height: thumb.height } : { width: 1, height: 1 }
}

function getThumbnail(imageField: Attachment[], size: ImageSizes) {
  return imageField && imageField[0] && imageField[0].thumbnails && imageField[0].thumbnails[size]
}
