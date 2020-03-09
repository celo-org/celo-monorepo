import {
  ContractKit,
  newKitFromWeb3,
  CeloContract,
  IdentityMetadataWrapper,
} from '@celo/contractkit'
import { Client } from 'pg'
import Web3 from 'web3'

const CRAWLER_WEB3 = process.env['CRAWLER_WEB3'] || 'http://localhost:8545'
const CRAWLER_DATABASE = process.env['CRAWLER_DATABASE'] || 'blockscout'

const client = new Client({ database: CRAWLER_DATABASE })

// read all from table
// when they were last modified?

async function jsonQuery(query: string) {
  let res = await client.query(`SELECT json_agg(t) FROM (${query}) t`)
  return res.rows[0].json_agg
}

async function handleItem(item: { url: string }) {
  try {
    let metadata = await IdentityMetadataWrapper.fetchFromURL(item.url)
    console.log(metadata)
  } catch (err) {
    console.error('Cannot read metadata', err)
  }
}

async function main() {
  await client.connect()
  let items: { address: string; url: string }[] = await jsonQuery(
    `SELECT address, url FROM celo_account WHERE web_url_timestamp is NULL AND url is NOT NULL LIMIT 100`
  )
  for (let i of items) {
    handleItem(i)
  }

  /*
  const web3 = new Web3(CRAWLER_WEB3)
  const kit: ContractKit = newKitFromWeb3(web3)
  const token = await kit.contracts.getStableToken()
  const oracle = await kit.contracts.getSortedOracles()
  console.log(await oracle.medianRate(CeloContract.StableToken), token.address, oracle.address)
  */
}

main()
