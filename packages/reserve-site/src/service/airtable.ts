import AirtableAPI from 'airtable'

const AIRTABLE_TABLE_ID = 'appFFSLHqjejvZgYM'

let airTableSingleton: AirtableAPI

function airtableInit(baseID: string) {
  if (!airTableSingleton) {
    airTableSingleton = new AirtableAPI({ apiKey: process.env.AIRTABLE_API_KEY })
  }
  return airTableSingleton.base(baseID)
}

export default function getAirtable(name: TableNames) {
  return airtableInit(AIRTABLE_TABLE_ID)(name)
}

export enum TableNames {
  ReserveHoldings = 'Reserve Holdings',
  ReserveAddresses = 'Reserve Addresses',
}

export interface Record<Fields> {
  id: string
  fields: Fields
}
