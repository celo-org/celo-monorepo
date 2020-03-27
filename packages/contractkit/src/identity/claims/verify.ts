import { eqAddress } from '@celo/utils/lib/address'
import { isValidUrl } from '@celo/utils/lib/io'
import { Signer, verifySignature } from '@celo/utils/lib/signatureUtils'
import { resolveTxt } from 'dns'
import { Address } from '../../base'
import { IdentityMetadataWrapper } from '../metadata'
import { AccountClaim } from './account'
import { Claim, DomainClaim, hashOfClaim, serializeClaim } from './claim'
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
  metadataURLGetter: MetadataURLGetter,
  signer?: Signer
) {
  switch (claim.type) {
    case ClaimTypes.KEYBASE:
      return verifyKeybaseClaim(claim, address)
    case ClaimTypes.ACCOUNT:
      return verifyAccountClaim(claim, address, metadataURLGetter)
    case ClaimTypes.DOMAIN:
      return verifyDomainClaim(claim, address, signer as any, metadataURLGetter)
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
  signer: Signer,
  metadataURLGetter: MetadataURLGetter,
  dnsResolver: dnsResolverFunction = resolveTxt
) => {
  const metadataURL = await metadataURLGetter(claim.domain)
  const domain = claim.domain

  console.info('metadataURL ' + JSON.stringify(metadataURL))
  if (!isValidUrl(metadataURL)) {
    return `Metadata URL of ${claim.domain} could not be retrieved`
  }

  let metadata: IdentityMetadataWrapper
  let claimFound
  try {
    metadata = await IdentityMetadataWrapper.fetchFromURL(metadataURL)
    const existingClaims = metadata
      .filterClaims(ClaimTypes.DOMAIN)
      .filter((el: DomainClaim) => el.domain == domain)

    if (existingClaims.length < 1) {
      return `The domain ${domain} is not part of your metadata`
    }
    claimFound = existingClaims[0]
  } catch (error) {
    return `Metadata could not be fetched for ${claim.domain} at 
      ${metadataURL}: ${error.toString()}`
  }

  const signature = await signer.sign(serializeClaim(claimFound))

  return verifyDomainRecord(signature, address, claimFound, dnsResolver)
}

export const verifyDomainRecord = async (
  signature: string,
  address: string,
  claim: DomainClaim,
  dnsResolver: dnsResolverFunction = resolveTxt
) => {
  const signatureBase64 = Buffer.from(signature.toString(), 'binary').toString('base64')

  let found = false
  const domainPromise = new Promise((resolve) => {
    dnsResolver(claim.domain, (error, domainRecords) => {
      if (error) {
        console.log(`Unable to fetch domain TXT records: ${error.toString()}`)
      } else {
        domainRecords.forEach((record) => {
          console.log(`Domain record ${record}`)
          record.forEach((entry) => {
            console.log(`Entry ${entry}`)
            if (entry === 'celo-site-verification=' + signatureBase64) {
              console.debug(`TXT Record celo-site-verification found`)
              found = verifySignature(hashOfClaim(claim), signature, address)
            }
          })
        })
      }
      resolve()
    })
  })

  domainPromise.then(() => console.log(`Promise resolved`))
  // await Promise.resolve(domainPromise)
  // await Promise.all(domainPromise)

  if (found) {
    console.log(`TXT record found`)
    return
  }
  console.log(`NOT found`)
  return `Unable to verify domain claim`
}
