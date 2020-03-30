import { eqAddress } from '@celo/utils/lib/address'
import { isValidUrl } from '@celo/utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { resolveTxt } from 'dns'
import { Address } from '../../base'
import { IdentityMetadataWrapper } from '../metadata'
import { AccountClaim } from './account'
import { Claim, DomainClaim, domainTxtHeader, serializeClaim } from './claim'
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
  // signer?: Signer
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
  address: string,
  metadataURLGetter: MetadataURLGetter,
  dnsResolver: dnsResolverFunction = resolveTxt
) => {
  const metadataURL = await metadataURLGetter(claim.domain)
  const domain = claim.domain

  if (!isValidUrl(metadataURL)) {
    return `Metadata URL of ${claim.domain} could not be retrieved`
  }

  let metadata: IdentityMetadataWrapper
  let claimFound
  try {
    metadata = await IdentityMetadataWrapper.fetchFromURL(metadataURL)
    const existingClaims = metadata
      .filterClaims(ClaimTypes.DOMAIN)
      .filter((el: DomainClaim) => el.domain === domain)

    if (existingClaims.length < 1) {
      return `The domain ${domain} is not part of your metadata`
    }
    claimFound = existingClaims[0]
  } catch (error) {
    return `Metadata could not be fetched for ${claim.domain} at 
      ${metadataURL}: ${error.toString()}`
  }

  return verifyDomainRecord(address, claimFound, dnsResolver)
}

export const verifyDomainRecord = async (
  address: string,
  claim: DomainClaim,
  dnsResolver: dnsResolverFunction = resolveTxt
) => {
  const found = await new Promise((resolve) => {
    dnsResolver(claim.domain, (error, domainRecords) => {
      if (error) {
        console.log(`Unable to fetch domain TXT records: ${error.toString()}`)
      } else {
        domainRecords.forEach((record) => {
          record.forEach((entry) => {
            if (entry.startsWith(domainTxtHeader)) {
              console.log(`TXT Record celo-site-verification found`)
              const signatureBase64 = entry.substring(domainTxtHeader.length + 1)
              const signature = Buffer.from(signatureBase64, 'base64').toString('binary')
              // console.log(`Record: ${record}`)
              // console.log(`Signature: ${signature}`)
              // console.log(`Signature64: ${signatureBase64}`)
              if (verifySignature(serializeClaim(claim), signature, address)) {
                console.log(`Signature verified successfully`)
                resolve(true)
              }
            }
          })
        })
      }
      resolve(false)
    })
  })

  if (found) {
    return
  }
  console.log(`NOT found`)
  return `Unable to verify domain claim`
}
