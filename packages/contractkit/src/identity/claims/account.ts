import { AddressType, isValidUrl, PublicKeyType } from '@celo/utils/lib/io'
import { pubToAddress, toChecksumAddress } from 'ethereumjs-util'
import { either, isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Address } from '../../base'
import { IdentityMetadataWrapper } from '../metadata'
import { ClaimTypes, now, TimestampType } from './types'

// Provide the type minus the validation that the public key and address are derived from the same private key
export const AccountClaimTypeH = t.type({
  type: t.literal(ClaimTypes.ACCOUNT),
  timestamp: TimestampType,
  address: AddressType,
  // io-ts way of defining optional key-value pair
  publicKey: t.union([t.undefined, PublicKeyType]),
})

export const AccountClaimType = new t.Type<AccountClaim, any, unknown>(
  'AccountClaimType',
  AccountClaimTypeH.is,
  (unknownValue, context) =>
    either.chain(AccountClaimTypeH.validate(unknownValue, context), (claim) => {
      if (claim.publicKey === undefined) {
        return t.success(claim)
      }
      const derivedAddress = toChecksumAddress(
        '0x' + pubToAddress(Buffer.from(claim.publicKey.slice(2), 'hex'), true).toString('hex')
      )
      return derivedAddress === claim.address
        ? t.success(claim)
        : t.failure(claim, context, 'public key did not match the address in the claim')
    }),
  (x) => x
)

export type AccountClaim = t.TypeOf<typeof AccountClaimTypeH>

export const createAccountClaim = (address: string, publicKey?: string): AccountClaim => {
  const claim = {
    timestamp: now(),
    type: ClaimTypes.ACCOUNT,
    address,
    publicKey,
  }

  const parsedClaim = AccountClaimType.decode(claim)

  if (isLeft(parsedClaim)) {
    throw new Error(`A valid claim could not be created`)
  }

  return parsedClaim.right
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

  console.info(JSON.stringify(metadataURL))
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

  if (accountClaims.find((x) => x.address === address) === undefined) {
    return `${claim.address} did not claim ${address}`
  }

  return
}
