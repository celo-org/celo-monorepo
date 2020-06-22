import getAirtable, { Record, TableNames } from 'src/service/airtable'
import { HoldingsData } from 'src/service/Data'
const IS_LIVE = 'live=1'

interface Fields {
  live?: boolean
  'Updated Date': string
  'CELO on-chain': number
  'CELO in custody': number
  BTC: number
  ETH: number
  DAI: number
  cUSD: number
  'Reserve Ratio': number
}

export default async function fetchRecords() {
  const records = (await getAirtable(TableNames.ReserveHoldings)
    .select({
      maxRecords: 1,
      filterByFormula: IS_LIVE,
      sort: [{ field: 'order', direction: 'desc' }],
    })
    .firstPage()) as Record<Fields>[]
  return records.map((record) => convert(record.fields))[0]
}

function convert(fields: Fields): HoldingsData {
  return {
    updatedDate: fields['Update Date'],
    total: fields['CELO on-chain'] + fields['CELO in custody'],
    onChain: fields['CELO on-chain'],
    inCustody: fields['CELO in custody'],
    ratio: fields['Reserve Ratio'],
    BTC: fields.BTC,
    ETH: fields.ETH,
    DAI: fields.DAI,
    cUSD: fields.cUSD,
  }
}
