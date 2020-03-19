import { eqAddress } from '@celo/utils/lib/address'
import { isValidUrl } from '@celo/utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { resolveTxt } from 'dns'
import { Address } from '../../base'
import { IdentityMetadataWrapper } from '../metadata'
import { AccountClaim } from './account'
import { Claim, DomainClaim, hashOfClaims } from './claim'
import { verifyKeybaseClaim } from './keybase'
import { ClaimTypes } from './types'

/**
 * Verifies a claim made by an account, i.e. whether a claim can be verified to be correct
 * @param claim The claim to verify
 * @param address The address that is making the claim
 * @param metadataURLGetter A function that can retrieve the metadata URL for a given account address,
 *                          should be Accounts.getMetadataURL()
 * @returns If valid, returns undefined. If invalid or unable to verify, returns a string with the error
 */
export async function verifyClaim(
  claim: Claim,
  address: string,
  metadataURLGetter: MetadataURLGetter
) {
  switch (claim.type) {
    case ClaimTypes.KEYBASE:
      return verifyKeybaseClaim(claim, address)
    case ClaimTypes.ACCOUNT:
      return verifyAccountClaim(claim, address, metadataURLGetter)
    case ClaimTypes.DOMAIN:
      return verifyDomainClaim(claim, address, metadataURLGetter)
    default:
      break
  }
  return
}

/**
 * A function that can asynchronously fetch the metadata URL for an account address
 * Should virtually always be Accounts#getMetadataURL
 */
export type MetadataURLGetter = (address: Address) => Promise<string>

export const verifyAccountClaim = async (
  claim: AccountClaim,
  address: string,
  metadataURLGetter: MetadataURLGetter
) => {
  const metadataURL = await metadataURLGetter(claim.address)

  console.info('metadataURL ' + JSON.stringify(metadataURL))
  if (!isValidUrl(metadataURL)) {
    return `Metadata URL of ${claim.address} could not be retrieved`
  }

  let metadata: IdentityMetadataWrapper
  try {
    metadata = await IdentityMetadataWrapper.fetchFromURL(metadataURL)
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
export const verifyDomainClaim = async (
  claim: DomainClaim,
  _signer: string,
  metadataURLGetter: MetadataURLGetter,
  dnsResolver: dnsResolverFunction = resolveTxt
) => {
  const metadataURL = await metadataURLGetter(claim.domain)

  console.info('metadataURL ' + JSON.stringify(metadataURL))
  if (!isValidUrl(metadataURL)) {
    return `Metadata URL of ${claim.domain} could not be retrieved`
  }

  let metadata: IdentityMetadataWrapper
  try {
    metadata = await IdentityMetadataWrapper.fetchFromURL(metadataURL)
  } catch (error) {
    return `Metadata could not be fetched for ${claim.domain} at 
      ${metadataURL}: ${error.toString()}`
  }

  const signature = JSON.parse(metadata.toString()).meta.signature
  const address = JSON.parse(metadata.toString()).meta.address

  return verifyDomainRecord(signature, address, claim.domain, metadata, dnsResolver)
}

export const verifyDomainRecord = async (
  signature: string,
  address: string,
  domain: string,
  metadata: IdentityMetadataWrapper,
  dnsResolver: dnsResolverFunction = resolveTxt
) => {
  const signatureBase64 = Buffer.from(signature.toString(), 'binary').toString('base64')
  const domainClaims = metadata.filterClaims(ClaimTypes.DOMAIN)

  let found = false
  const domainPromises = domainClaims.map((domainClaim) => {
    return new Promise((resolve) => {
      if (domain === domainClaim.domain) {
        dnsResolver(domainClaim.domain, (_error, domainRecords) => {
          if (_error) {
            console.log(`Unable to fetch domain TXT records: ${_error.toString()}`)
          } else {
            domainRecords.forEach((record) => {
              record.forEach((entry) => {
                if (entry === 'celo-site-verification=' + signatureBase64) {
                  console.debug(`TXT Record celo-site-verification found in ${domainClaim.domain}`)
                  found = verifySignature(hashOfClaims(metadata.claims), signature, address)
                }
              })
            })
          }
          resolve()
        })
      }
    })
  })

  await Promise.all(domainPromises)

  if (found) {
    return
  }
  return `Unable to verify domain claim`
}
