import { eqAddress } from '@celo/utils/lib/address'
import { isValidUrl } from '@celo/utils/lib/io'
import { ContractKit } from '../..'
import { IdentityMetadataWrapper } from '../metadata'
import { AccountClaim } from './account'
import { Claim } from './claim'
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
      return verifyKeybaseClaim(claim, address)
    case ClaimTypes.ACCOUNT:
      return verifyAccountClaim(kit, claim, address)
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

  console.info(JSON.stringify(metadataURL))
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
