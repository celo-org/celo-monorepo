import { IdentityMetadataWrapper } from '@celo/contractkit'
import { Client } from 'pg'
import { ClaimTypes } from '@celo/contractkit/src/identity'
import { verifyClaim } from '@celo/contractkit/src/identity/claims/verify'
import { normalizeAddress } from '@celo/utils/src/address'

const CRAWLER_DATABASE = process.env['CRAWLER_DATABASE'] || 'blockscout'

const client = new Client({ database: CRAWLER_DATABASE })

// read all from table
// when they were last modified?

async function jsonQuery(query: string) {
  let res = await client.query(`SELECT json_agg(t) FROM (${query}) t`)
  return res.rows[0].json_agg
}

async function urlGetter(_str: string) {
  return ''
}

async function addUrl(address: string, domain: string, verified: boolean) {
  await client.query(
    `UPDATE celo_account SET web_url = $1, web_url_verified = $2, web_url_timestamp=now() WHERE address = $3`,
    [domain, verified, Buffer.from(address, 'hex')]
  )
}

async function handleItem(item: { url: string; address: string }) {
  try {
    let metadata = await IdentityMetadataWrapper.fetchFromURL(item.url)
    let claims = metadata.filterClaims(ClaimTypes.DOMAIN)
    console.log('claims', claims)
    if (claims.length === 0) {
      return
    }
    let claim = claims[0]
    let verified = (await verifyClaim(claim, item.address, urlGetter)) === undefined
    addUrl(item.address, claim.domain, verified)
  } catch (err) {
    console.error('Cannot read metadata', err)
  }
}

async function main() {
  await client.connect()
  addUrl('e89897510bfb2fc0647325fb6d580594c061acbf', 'http://test.com/', false)
  let items: { address: string; url: string }[] = await jsonQuery(
    `SELECT address, url FROM celo_account WHERE web_url_timestamp is NULL AND url is NOT NULL LIMIT 5`
  )
  items = items.map((a) => ({ ...a, address: normalizeAddress(a.address.substr(2)) }))
  console.log(items)
  for (let i of items) {
    handleItem(i)
  }
  await client.end()
}

main()
