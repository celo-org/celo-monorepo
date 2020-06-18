import getAirtable, { TableNames } from 'service/airtable'
import { HoldingsData } from 'service/Data'
const IS_LIVE = 'live=1'

interface Fields {
  live?: boolean
  'Updated Date': string
  'Total Celo': number
  'CELO on-chain': number
  'CELO in custody': number
  BTC: number
  ETH: number
  DAI: number
  cUSD: number
  'Reserve Ratio': number
}

interface Record {
  id: string
  fields: Fields
}

export default function() {
  return fetchRecords()
}

async function fetchRecords() {
  const records = (await getAirtable(TableNames.ReserveHoldings)
    .select({
      maxRecords: 1,
      filterByFormula: IS_LIVE,
      sort: [{ field: 'order', direction: 'desc' }],
    })
    .firstPage()) as Record[]
  return records.map((record) => convert(record.fields))[0]
}

function convert(fields: Fields): HoldingsData {
  return {
    updatedDate: fields['Update Date'],
    total: fields['Total Celo'],
    onChain: fields['CELO on-chain'],
    inCustody: fields['CELO in custody'],
    ratio: fields['Reserve Ratio'],
    BTC: fields.BTC,
    ETH: fields.ETH,
    DAI: fields.DAI,
    cUSD: fields.cUSD,
  }
}
