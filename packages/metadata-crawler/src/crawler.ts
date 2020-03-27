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
  // .catch( error => console.error(`Error in jsonQuery: ${error}`))
  return res.rows[0].json_agg
}

// async function urlGetter(_str: string) {
//   return ''
// }

async function addVerificationClaimToDatabase(address: string, domain: string, verified: boolean) {
  try {
    const query = `INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES 
        (decode($1, 'hex'), 'domain', $2, $3, now(), now(), now()) 
        ON CONFLICT (address, type, element) DO 
        UPDATE SET verified=$3, timestamp=now(), updated_at=now() `
    const values = [address, domain, verified]

    await client
      .query(query, values)
      .catch((error) => console.error(`Database error ${error}\n query: ${query}`))
      .then(() => console.log(`Verification flag added to domain ${domain} and address ${address}`))
  } catch (err) {
    console.error('Error updating the database', err)
  }
}

async function handleItem(item: { url: string; address: string }) {
  try {
    let metadata = await IdentityMetadataWrapper.fetchFromURL(item.url)
    let claims = metadata.filterClaims(ClaimTypes.DOMAIN)

    const numClaims = claims.length
    for (let i = 0; i < numClaims; i++) {
      const claim = claims[i]
      const alreadyVerified = await isClaimAlreadyVerified(item.address, claim.domain)
      if (!alreadyVerified) {
        console.log(`Verifying ${claim.domain} for address ${item.address}`)
        const verified = await verifyDomainRecord(
          JSON.parse(metadata.toString()).meta.signature,
          item.address,
          claim
        ).catch((error) => console.error(`Error in verifyDomainRecord ${error}`))
        console.debug(`Claim = ${claim.domain}`)
        if (verified === undefined)
          await addVerificationClaimToDatabase(item.address, claim.domain, true)
        else console.error(verified)
      }
    }
  } catch (err) {
    console.error('Cannot read metadata', err)
  }
}

async function isClaimAlreadyVerified(address: string, domain: string): Promise<boolean> {
  const query = `SELECT verified FROM celo_claims WHERE  address=decode('${address}', 'hex') AND
                element='${domain}' AND type='domain' AND timestamp IS NOT NULL AND verified=true`
  jsonQuery(query)
    .catch((error) => console.error(`Error verifying claim in DB: ${error}\n${query}`))
    .then((items) => {
      items = items || []
      if (items.length > 0) return true
      return false
    })
  return false
}

async function main() {
  console.debug('Connecting to: ' + PGHOST)
  await client.connect()

  client.on('error', (e) => {
    console.log(`Reconnecting after ${e}`)
    client.connect()
  })

  let items: { address: string; url: string }[] = await jsonQuery(
    `SELECT address, url FROM celo_account WHERE url is NOT NULL `
  )

  items = items || []
  items = items.map((a) => ({ ...a, address: normalizeAddress(a.address.substr(2)) }))
  console.log(items)
  for (let i of items) {
    await handleItem(i).catch(() => console.error(i, ' fails'))
  }
  await client.end()
}

main()
