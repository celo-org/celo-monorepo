import { Address } from '@celo/connect'
import { newKitFromWeb3 } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import {
  verifyAccountClaim,
  verifyDomainRecord,
} from '@celo/contractkit/lib/identity/claims/verify'
import { normalizeAddressWith0x, trimLeading0x } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import Logger from 'bunyan'
import { Client } from 'pg'
import Web3 from 'web3'
import { dataLogger, logger, operationalLogger } from './logger'

const CONCURRENCY = 10

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

const kit = newKitFromWeb3(new Web3(PROVIDER_URL))

async function jsonQuery(query: string) {
  let res = await client.query(`SELECT json_agg(t) FROM (${query}) t`)
  return res.rows[0].json_agg
}

async function createVerificationClaims(
  address: string,
  domain: string,
  verified: boolean,
  accounts: Array<Address>
) {
  await addDatabaseVerificationClaims(address, domain, verified)
  await concurrentMap(CONCURRENCY, accounts, (account) =>
    addDatabaseVerificationClaims(account, domain, verified)
  )
}

async function addDatabaseVerificationClaims(address: string, domain: string, verified: boolean) {
  try {
    const query = `INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES
        (decode($1, 'hex'), 'domain', $2, $3, now(), now(), now())
        ON CONFLICT (address, type, element) DO
        UPDATE SET verified=$3, timestamp=now(), updated_at=now() `
    // Trim 0x to match Blockscout convention
    const values = [trimLeading0x(address), domain, verified]

    await client
      .query(query, values)
      .catch((err) => logger.error({ err, query }, 'addDataBaseVerificationClaims error'))
      .then(() => dataLogger.info({ domain, address }, 'VERIFIED_DOMAIN_CLAIM'))
  } catch (err) {
    logger.error({ err }, 'addDataBaseVerificationClaims error')
  }
}

async function getVerifiedAccounts(metadata: IdentityMetadataWrapper, address: Address) {
  const unverifiedAccounts = metadata.filterClaims(ClaimTypes.ACCOUNT)
  const accountVerification = await Promise.all(
    unverifiedAccounts.map(async (claim) => ({
      claim,
      verified: await verifyAccountClaim(kit, claim, address),
    }))
  )
  const accounts = accountVerification
    .filter(({ verified }) => verified === undefined)
    .map((a) => a.claim.address)

  return accounts
}

async function getVerifiedDomains(
  metadata: IdentityMetadataWrapper,
  address: Address,
  logger: Logger
) {
  const unverifiedDomains = metadata.filterClaims(ClaimTypes.DOMAIN)

  const domainVerification = await concurrentMap(CONCURRENCY, unverifiedDomains, async (claim) => {
    try {
      const verificationStatus = await verifyDomainRecord(kit, claim, address)
      logger.debug({ claim, verificationStatus }, `verified_domain`)
      return {
        claim,
        verified: verificationStatus === undefined,
      }
    } catch (err) {
      logger.error({ err, claim })
      return {
        claim,
        verified: false,
      }
    }
  })

  const domains = domainVerification.filter(({ verified }) => verified).map((_) => _.claim.domain)

  return domains
}

async function processDomainClaimForValidator(item: { url: string; address: string }) {
  const itemLogger = operationalLogger.child({ url: item.url, address: item.address })
  try {
    itemLogger.debug('fetch_metadata')
    const metadata = await IdentityMetadataWrapper.fetchFromURL(
      await kit.contracts.getAccounts(),
      item.url
    )
    const verifiedAccounts = await getVerifiedAccounts(metadata, item.address)
    const verifiedDomains = await getVerifiedDomains(metadata, item.address, itemLogger)

    await concurrentMap(CONCURRENCY, verifiedDomains, (domain) =>
      createVerificationClaims(item.address, domain, true, verifiedAccounts)
    )

    itemLogger.debug(
      {
        verfiedAccountClaims: verifiedAccounts.length,
        verifiedDomainClaims: verifiedDomains.length,
      },
      'processDomainClaimForValidator done'
    )
  } catch (err) {
    itemLogger.error({ err }, 'processDomainClaimForValidator error')
  }
}

async function processDomainClaims() {
  let items: { address: string; url: string }[] = await jsonQuery(
    `SELECT address, url FROM celo_account WHERE url is NOT NULL `
  )

  operationalLogger.debug({ length: items.length }, 'fetching all accounts')

  items = items || []
  items = items.map((a) => ({
    ...a,
    // Addresses are stored by blockscout as just the bytes prepended with \x
    address: normalizeAddressWith0x(a.address.substring(2)),
  }))

  return concurrentMap(CONCURRENCY, items, (item) => processDomainClaimForValidator(item))
    .then(() => {
      operationalLogger.info('Closing DB connecting and finishing')
    })
    .catch((err) => {
      operationalLogger.error({ err }, 'processDomainClaimForValidator error')
      client.end()
      process.exit(1)
    })
}

async function main() {
  operationalLogger.info({ host: PGHOST }, 'Connecting DB')
  await client.connect()

  client.on('error', (err) => {
    operationalLogger.error({ err }, 'Reconnecting after error')
    client.connect()
  })

  await processDomainClaims()

  client.end()
  process.exit(0)
}

main().catch((err) => {
  operationalLogger.error({ err })
  process.exit(1)
})
