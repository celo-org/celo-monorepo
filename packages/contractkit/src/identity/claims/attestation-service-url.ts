import { eqAddress } from '@celo/utils/lib/address'
import { AttestationServiceStatusResponseType, UrlType } from '@celo/utils/lib/io'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Address } from '../../base'
import { ContractKit } from '../../kit'
import { ClaimTypes, now, TimestampType } from './types'

const SIGNATURE_PREFIX = 'attestation-service-status-signature:'

export const AttestationServiceURLClaimType = t.type({
  type: t.literal(ClaimTypes.ATTESTATION_SERVICE_URL),
  timestamp: TimestampType,
  url: UrlType,
})

export type AttestationServiceURLClaim = t.TypeOf<typeof AttestationServiceURLClaimType>

export const createAttestationServiceURLClaim = (url: string): AttestationServiceURLClaim => ({
  url,
  timestamp: now(),
  type: ClaimTypes.ATTESTATION_SERVICE_URL,
})

export async function validateAttestationServiceUrl(
  kit: ContractKit,
  claim: AttestationServiceURLClaim,
  address: Address
): Promise<string | undefined> {
  try {
    const randomMessage = kit.web3.utils.randomHex(32)

    const url = claim.url + '/status?messageToSign=' + randomMessage

    const resp = await fetch(url)

    if (!resp.ok) {
      return `Could not request sucessfully from ${url}", received status ${resp.status}`
    }

    const jsonResp = await resp.json()

    const parsedResponse = AttestationServiceStatusResponseType.decode(jsonResp)

    if (isLeft(parsedResponse)) {
      return `Response from ${url} could not be parsed successfully`
    }

    const claimedAccountAddress = parsedResponse.right.accountAddress
    if (!eqAddress(claimedAccountAddress, address)) {
      return `The service claims ${claimedAccountAddress}, but metadata claims ${address}`
    }

    const accounts = await kit.contracts.getAccounts()

    const attestationKeyAddress = await accounts.getAttestationSigner(address)

    if (attestationKeyAddress === '0x0' || eqAddress(address, attestationKeyAddress)) {
      return `The account has not specified a separate attestation key`
    }

    if (
      !parsedResponse.right.signature ||
      !verifySignature(
        SIGNATURE_PREFIX + randomMessage,
        parsedResponse.right.signature,
        attestationKeyAddress
      )
    ) {
      return `The service's attestation key differs from the smart contract registered one`
    }

    return
  } catch (error) {
    return `Could not validate attestation service claim: ${error}`
  }
}
