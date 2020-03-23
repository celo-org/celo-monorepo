import { IdentityMetadataWrapper } from '@celo/contractkit'
import { Client } from 'pg'
import { ClaimTypes } from '@celo/contractkit/lib/identity'
import { verifyDomainRecord } from '@celo/contractkit/lib/identity/claims/verify'
import { normalizeAddress } from '@celo/utils/lib/address'

const PGUSER = process.env['PGUSER'] || 'postgres'
const PGPASSWORD = process.env['PGPASSWORD'] || ''
const PGHOST = process.env['PGHOST'] || '127.0.0.1'
const PGPORT = process.env['PGPORT'] || '5432'
const PGDATABASE = process.env['PGDATABASE'] || 'blockscout'

const client = new Client({
  user: PGUSER,
  password: PGPASSWORD,
  host: PGHOST,
  port: Number(PGPORT),
  database: PGDATABASE,
})

// read all from table
// when they were last modified?

async function jsonQuery(query: string) {
  let res = await client.query(`SELECT json_agg(t) FROM (${query}) t`)
  return res.rows[0].json_agg
}

// async function urlGetter(_str: string) {
//   return ''
// }

async function addUrl(address: string, domain: string, verified: boolean) {
  try {
    client.query(
      `INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES ` +
        `($1, 'domain', $2, $3, now(), now(), now()) ` +
        `ON CONFLICT (celo_claims_address_type_element_index) DO ` +
        `UPDATE celo_claims SET celo_verified=$3, timestamp=now(), updated_at=now() WHERE address=$1 AND domain=$2 and type='domain' `,
      [Buffer.from(address, 'hex'), domain, verified]
    )
    console.log(`Verification flag added to domain ${domain} and address ${address}`)
  } catch (err) {
    console.error('Error updating the database', err)
  }
}

async function handleItem(item: { url: string; address: string }) {
  try {
    let metadata = await IdentityMetadataWrapper.fetchFromURL(item.url)
    let claims = metadata.filterClaims(ClaimTypes.DOMAIN)
    console.log('claims', claims)
    //     if (claims.length === 0) {
    //       return
    //     }
    //
    //     let claim = claims[0]
    console.log(item.address)
    claims.map((claim) => {
      //const alreadyVerified =
      isClaimAlreadyVerified(item.address, claim.domain).then((alreadyVerified: boolean) => {
        if (!alreadyVerified) {
          console.log(`Verifying ${claim.domain} for address ${item.address}`)
          verifyDomainRecord(
            JSON.parse(metadata.toString()).meta.signature,
            item.address,
            claim.domain,
            metadata
          )
            // verifyClaim(claim, item.address, urlGetter)
            .then((verified) => {
              console.log(`Claim = ${claim.domain}`)
              if (verified === undefined) addUrl(item.address, claim.domain, true)
              else console.error(verified)
            })
          // let verified = (await verifyClaim(claim, item.address, urlGetter)) === undefined
          // addUrl(item.address, claim.domain, verified)
        }
      })
    })
  } catch (err) {
    console.error('Cannot read metadata', err)
  }
}

async function isClaimAlreadyVerified(address: string, domain: string): Promise<boolean> {
  jsonQuery(
    `SELECT verified FROM celo_claims WHERE address=${address} AND 
                domain=${domain} AND type='domain' AND timestamp = NOT NULL AND verified=true`
  ).then((items) => {
    items = items || []
    if (items.length > 0) return true
    return false
  })
  return false
}

async function main() {
  console.debug('Connecting to: ' + PGHOST)
  await client.connect()
  let items: { address: string; url: string }[] = await jsonQuery(
    `SELECT address, url FROM celo_account WHERE url is NOT NULL `
  )
  // `SELECT a.address AS address, a.url AS url FROM celo_account AS a, celo_claims AS c WHERE a.address = c.address AND c.timestamp is NULL AND a.url is NOT NULL`
  // `SELECT address, url FROM celo_account WHERE domain_timestamp is NULL AND url is NOT NULL `)

  items = items || []
  items = items.map((a) => ({ ...a, address: normalizeAddress(a.address.substr(2)) }))
  console.log(items)
  for (let i of items) {
    await handleItem(i)
  }
  await client.end()
}

main()
