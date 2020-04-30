import { eqAddress } from '@celo/utils/lib/address'
import { isValidUrl } from '@celo/utils/lib/io'
import { resolveTxt } from 'dns'
import { promisify } from 'util'
import { ContractKit } from '../..'
import { IdentityMetadataWrapper } from '../metadata'
import { AccountClaim } from './account'
import { Claim, DOMAIN_TXT_HEADER, DomainClaim, serializeClaim } from './claim'
import { verifyKeybaseClaim } from './keybase'
import { ClaimTypes } from './types'

/**
 * Verifies a claim made by an account, i.e. whether a claim can be verified to be correct
 * @param kit ContractKit object
 * @param claim The claim to verify
 * @param address The address that is making the claim
 * @returns If valid, returns undefined. If invalid or unable to verify, returns a string with the error
 */
export async function verifyClaim(kit: ContractKit, claim: Claim, address: string) {
  switch (claim.type) {
    case ClaimTypes.KEYBASE:
      return verifyKeybaseClaim(kit, claim, address)
    case ClaimTypes.ACCOUNT:
      return verifyAccountClaim(kit, claim, address)
    case ClaimTypes.DOMAIN:
      return verifyDomainRecord(kit, claim, address)
    default:
      break
  }
  return
}

export const verifyAccountClaim = async (
  kit: ContractKit,
  claim: AccountClaim,
  address: string
) => {
  const metadataURL = await (await kit.contracts.getAccounts()).getMetadataURL(claim.address)

  console.info('metadataURL ' + JSON.stringify(metadataURL))
  if (!isValidUrl(metadataURL)) {
    return `Metadata URL of ${claim.address} could not be retrieved`
  }

  let metadata: IdentityMetadataWrapper
  try {
    metadata = await IdentityMetadataWrapper.fetchFromURL(kit, metadataURL)
  } catch (error) {
    return `Metadata could not be fetched for ${
      claim.address
    } at ${metadataURL}: ${error.toString()}`
  }

  const accountClaims = metadata.filterClaims(ClaimTypes.ACCOUNT)

  if (accountClaims.find((x) => eqAddress(x.address, address)) === undefined) {
    return `${claim.address} did not claim ${address}`
  }

  return
}

type dnsResolverFunction = (
  hostname: string,
  callback: (err: NodeJS.ErrnoException, addresses: string[][]) => void
) => void

/**
 * It verifies if a DNS domain includes in the TXT records an entry with name
 * `celo-site-verification` and a valid signature in base64
 */
export const verifyDomainRecord = async (
  kit: ContractKit,
  claim: DomainClaim,
  address: string,
  dnsResolver: dnsResolverFunction = resolveTxt as any
) => {
  try {
    const getRecords = promisify(dnsResolver)
    const domainRecords = await getRecords(claim.domain)
    for (const record of domainRecords) {
      for (const entry of record) {
        if (entry.startsWith(DOMAIN_TXT_HEADER)) {
          console.debug(`TXT Record celo-site-verification found`)
          const signatureBase64 = entry.substring(DOMAIN_TXT_HEADER.length + 1)
          const signature = Buffer.from(signatureBase64, 'base64').toString('binary')
          if (
            await IdentityMetadataWrapper.verifySignerForAddress(
              kit,
              serializeClaim(claim),
              signature,
              address
            )
          ) {
            console.debug(`Signature verified successfully`)
            return
          }
        }
      }
    }
    console.debug(`Domain not validated correctly`)
    return `Unable to verify domain claim with address ${address}`
  } catch (error) {
    console.debug(`Unable to fetch domain TXT records: ${error.toString()}`)
    return `Unable to fetch domain TXT records: ${error.toString()}`
  }
}
