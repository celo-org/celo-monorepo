import { Address } from '@celo/utils/lib/address'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { hashOfClaim, SignedClaimType } from './claim'
import { ClaimTypes, now, TimestampType } from './types'

export const KeybaseClaimType = t.type({
  type: t.literal(ClaimTypes.KEYBASE),
  timestamp: TimestampType,
  // TODO: Validate compliant username before just interpolating
  username: t.string,
})
export type KeybaseClaim = t.TypeOf<typeof KeybaseClaimType>

export const keybaseFilePathToProof = `.well-known/celo/`
export const proofFileName = (address: Address) => `verify-${address}.json`
export const targetURL = (username: string, address: Address) =>
  `https://${username}.keybase.pub/${keybaseFilePathToProof}${proofFileName(address)}`

// If verification encounters an error, returns the error message as a string
// otherwise returns undefined when successful
export async function verifyKeybaseClaim(
  claim: KeybaseClaim,
  signer: Address
): Promise<string | undefined> {
  try {
    const resp = await fetch(targetURL(claim.username, signer))
    if (!resp.ok) {
      return `Proof of ownership could not be retrieved at ${targetURL(
        claim.username,
        signer
      )}, request yielded ${resp.status} status code`
    }

    const jsonResp = await resp.json()
    const parsedClaim = SignedClaimType.decode(jsonResp)
    if (isLeft(parsedClaim)) {
      return 'Claim is incorrectly formatted'
    }

    const hasValidSiganture = verifySignature(
      hashOfClaim(parsedClaim.right.claim),
      parsedClaim.right.signature,
      signer
    )

    if (!hasValidSiganture) {
      return 'Claim does not contain a valid signature'
    }

    const parsedKeybaseClaim = KeybaseClaimType.decode(parsedClaim.right.claim)
    if (isLeft(parsedKeybaseClaim)) {
      return 'Hosted claim is not a Keybase claim'
    }

    if (parsedKeybaseClaim.right.username !== claim.username) {
      return 'Usernames do not match'
    }

    return
  } catch (error) {
    return 'Could not verify Keybase claim: ' + error
  }
}

export const createKeybaseClaim = (username: string): KeybaseClaim => ({
  username,
  timestamp: now(),
  type: ClaimTypes.KEYBASE,
})
