import { Client } from 'pg'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { verifyDomainRecord } from '@celo/contractkit/lib/identity/claims/verify'
import { normalizeAddress } from '@celo/utils/lib/address'
import { serializeClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { logger } from './logger'
import { AccountClaim } from '@celo/contractkit/lib/identity/claims/account'

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

async function jsonQuery(query: string) {
  let res = await client.query(`SELECT json_agg(t) FROM (${query}) t`)
  return res.rows[0].json_agg
}

async function createVerificationClaims(
  address: string,
  domain: string,
  verified: boolean,
  accounts: Array<AccountClaim>
) {
  await addDatabaseVerificationClaims(address, domain, verified)
  await Promise.all(
    accounts.map(async (account) => {
      await addDatabaseVerificationClaims(account.address.replace('0x', ''), domain, verified)
    })
  )
}

async function addDatabaseVerificationClaims(address: string, domain: string, verified: boolean) {
  try {
    const query = `INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES 
        (decode($1, 'hex'), 'domain', $2, $3, now(), now(), now()) 
        ON CONFLICT (address, type, element) DO 
        UPDATE SET verified=$3, timestamp=now(), updated_at=now() `
    const values = [address, domain, verified]

    await client
      .query(query, values)
      .catch((error) => logger.error(`Database error ${error}\n query: ${query}`))
      .then(() => logger.info(`Verification flag added to domain ${domain} and address ${address}`))
  } catch (err) {
    logger.error('Error updating the database', err)
  }
}

async function handleItem(item: { url: string; address: string }) {
  try {
    let metadata = await IdentityMetadataWrapper.fetchFromURL(item.url)
    let claims = metadata.filterClaims(ClaimTypes.DOMAIN)
    const accounts = metadata.filterClaims(ClaimTypes.ACCOUNT)

    const numClaims = claims.length
    for (let i = 0; i < numClaims; i++) {
      const claim = claims[i]
      const addressWith0x = '0x' + item.address
      logger.debug('Claim: ' + serializeClaim(claim))
      logger.debug('Accounts: ' + JSON.stringify(accounts))
      // const alreadyVerified = await isClaimAlreadyVerified(item.address, claim.domain)
      // logger.debug(`Is already verified? ${alreadyVerified}`)
      // if (!alreadyVerified) {
      logger.debug(`Verifying ${claim.domain} for address ${addressWith0x}`)

      const verified = await verifyDomainRecord(addressWith0x, claim).catch((error) =>
        logger.error(`Error in verifyDomainClaim ${error}`)
      )
      if (verified === undefined)
        await createVerificationClaims(item.address, claim.domain, true, accounts)
      else logger.debug(verified)
      // }
    }
  } catch (err) {
    logger.error('Cannot read metadata', err)
  }
}

// async function isClaimAlreadyVerified(address: string, domain: string): Promise<boolean> {
//   const query = `SELECT verified FROM celo_claims WHERE  address=decode('${address}', 'hex') AND
//                 element='${domain}' AND type='domain' AND timestamp IS NOT NULL AND verified=true`
//
//   let items: { verified: boolean }[] = await jsonQuery(query).catch((_error) => {})
//
//   items = items || []
//   if (items.length > 0) return false
//   return false
// }

async function main() {
  logger.info('Connecting DB: ' + PGHOST)
  await client.connect()

  client.on('error', (e) => {
    logger.debug(`Reconnecting after ${e}`)
    client.connect()
  })

  let items: { address: string; url: string }[] = await jsonQuery(
    `SELECT address, url FROM celo_account WHERE url is NOT NULL `
  )

  items = items || []
  items = items.map((a) => ({
    ...a,
    address: normalizeAddress(a.address.substr(2)),
  }))

  await Promise.all(
    items.map(async (item) => {
      await handleItem(item)
    })
  )
    .then(() => {
      logger.info('Closing DB connecting and finishing')
      client.end()
      process.exit(0)
    })
    .catch((error) => {
      logger.error(`Error: ${error}`)
      client.end()
      process.exit(1)
    })
}

main().catch((err) => {
  logger.error({ err })
  process.exit(1)
})
