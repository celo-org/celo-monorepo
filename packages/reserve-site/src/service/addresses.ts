import getAirtable, { Record, TableNames } from 'src/service/airtable'
import { Addresses } from 'src/service/Data'
const IS_LIVE = 'live=1'

interface Fields {
  live?: boolean
  CELO: string
  'CELO in custody': string
  BTC: string
  ETH: string
  DAI: string
}

export default async function fetchRecords() {
  const records = (await getAirtable(TableNames.ReserveAddresses)
    .select({
      maxRecords: 1,
      filterByFormula: IS_LIVE,
      sort: [{ field: 'order', direction: 'desc' }],
    })
    .firstPage()) as Record<Fields>[]
  return records.map((record) => convert(record.fields))[0]
}

function convert(fields: Fields): Addresses {
  return {
    celoAddress: fields.CELO,
    custodyAddress: fields['CELO in custody'],
    btcAddress: fields.BTC,
    ethAddress: fields.ETH,
    daiAddress: fields.DAI,
  }
}
