import { Attachment, FieldSet, Table } from 'airtable'
import getConfig from 'next/config'
import { Contributor } from '../src/about/Contributor'
import airtableInit from './airtable'
import { cache } from './cache'

interface Fields extends FieldSet {
  'Full Name': string
  Photo: Attachment[]
  'Unique Purpose': string
  'Social Media Link': string
  Company: string
  Team: string
  Approved: boolean
}

const SHEET = 'About Profiles'

export default async function getContributors() {
  return cache(`air-${SHEET}`, fetchContributors)
}

async function fetchContributors() {
  return getAirtable(SHEET)
    .select({
      filterByFormula: `AND(${IS_APROVED})`,
    })
    .all()
    .then((records) => {
      return records.map((r) => normalize(r.fields))
    })
}

function getAirtable(sheet: string) {
  return airtableInit(getConfig().serverRuntimeConfig.AIRTABLE_ANNOUNCEMENT_ID)(sheet) as Table<
    Fields
  >
}

const IS_APROVED = 'Approved=1'

function normalize(asset: Fields): Contributor {
  return {
    name: asset['Full Name'],
    purpose: asset['Unique Purpose'],
    team: asset.Team,
    company: asset.Company,
    photo: getImageURI(asset, Sizes.large),
    preview: getImageURI(asset, Sizes.small),
    url: asset['Social Media Link'],
  }
}

enum Sizes {
  large = 'large',
  small = 'small',
}

function getImageURI(asset: Fields, size: Sizes) {
  const previewField = asset.Photo

  return (
    (previewField &&
      previewField[0] &&
      previewField[0].thumbnails &&
      previewField[0].thumbnails[size].url) ||
    ''
  )
}
