import { Client } from 'pg'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import {
  verifyDomainRecord,
  verifyAccountClaim,
} from '@celo/contractkit/lib/identity/claims/verify'
import { normalizeAddress } from '@celo/utils/lib/address'
import { ClaimPayload, serializeClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { newKit } from '@celo/contractkit'
import { logger } from './logger'
import { AccountClaim } from '@celo/contractkit/lib/identity/claims/account'

const PGUSER = process.env['PGUSER'] || 'postgres'
const PGPASSWORD = process.env['PGPASSWORD'] || ''
const PGHOST = process.env['PGHOST'] || '127.0.0.1'
const PGPORT = process.env['PGPORT'] || '5432'
const PGDATABASE = process.env['PGDATABASE'] || 'blockscout'
const PROVIDER_URL = process.env['PROVIDER_URL'] || 'http://localhost:8545'

const client = new Client({
  user: PGUSER,
  password: PGPASSWORD,
  host: PGHOST,
  port: Number(PGPORT),
  database: PGDATABASE,
})

const kit = newKit(PROVIDER_URL)

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
      .catch((error) => logger.error('Database error %s, query: %s', error, query))
      .then(() =>
        logger.info('Verification flag added to domain %s and address %s', domain, address)
      )
  } catch (err) {
    logger.error('Error updating the database', err)
  }
}

async function handleItem(item: { url: string; address: string }) {
  try {
    let metadata = await IdentityMetadataWrapper.fetchFromURL(kit, item.url)
    let claims = metadata.filterClaims(ClaimTypes.DOMAIN)
    const unverifiedAccounts = metadata.filterClaims(ClaimTypes.ACCOUNT)
    const accountVerification = await Promise.all(
      unverifiedAccounts.map(async (claim) => ({
        claim,
        verified: await verifyAccountClaim(kit, claim, item.address),
      }))
    )
    const accounts = accountVerification
      .filter(({ verified }) => verified === undefined)
      .map((a) => a.claim)

    await Promise.all(
      claims.map(async (claim: ClaimPayload<ClaimTypes.DOMAIN>) => {
        const addressWith0x = '0x' + item.address
        logger.debug('Claim: %s', serializeClaim(claim))
        logger.debug('Accounts: %s', JSON.stringify(accounts))
        logger.debug('Verifying %s for address %s', claim.domain, addressWith0x)

        const verificationStatus = await verifyDomainRecord(
          kit,
          claim,
          addressWith0x
        ).catch((error: any) => logger.error('Error in verifyDomainClaim %s', error))
        if (verificationStatus === undefined)
          // If undefined means the claim was verified successfully
          await createVerificationClaims(item.address, claim.domain, true, accounts)
        else logger.debug(verificationStatus)
      })
    )
  } catch (err) {
    logger.error('Cannot read metadata %s', err)
  }
}

async function main() {
  logger.info('Connecting DB: %s', PGHOST)
  await client.connect()

  client.on('error', (error) => {
    logger.debug('Reconnecting after %s', error)
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
      logger.error('Error: %s', error)
      client.end()
      process.exit(1)
    })
}

main().catch((err) => {
  logger.error({ err })
  process.exit(1)
})
