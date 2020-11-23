import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/contractkit/src/identity/odis/phone-number-identifier'
import { GetAttestationRequest } from '@celo/utils/lib/io'
import { Address } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import Logger from 'src/utils/Logger'

const TAG = 'identity/securityCode'

const cache: { [key: string]: string } = {}

function hashAddressToSingleDigit(address: Address): number {
  return new BigNumber(address.toLowerCase()).modulo(10).toNumber()
}

export function getSecurityCodePrefix(issuerAddress: Address) {
  if (!cache[issuerAddress]) {
    cache[issuerAddress] = `${hashAddressToSingleDigit(issuerAddress)}`
  }
  return cache[issuerAddress]
}

export function extractSecurityCodeWithPrefix(message: string) {
  const matches = message.match('\\s(\\d{8})\\s')
  if (matches && matches.length === 2) {
    return matches[1]
  }
  return null
}

// We look for the case, where all the promises fail or the first one to succeed.
// Promise.all looks for all the values or the first error, so we can switch roles
// for reject and resolve to achieve what we need
async function raceUntilSuccess<T>(promises: Array<Promise<T>>) {
  try {
    const errors = await Promise.all(
      promises.map((promise) => {
        return new Promise((resolve, reject) => {
          promise.then(reject).catch(resolve)
        })
      })
    )
    return Promise.reject(errors)
  } catch (firstValue) {
    return Promise.resolve(firstValue)
  }
}

export async function getAttestationCodeForSecurityCode(
  attestationsWrapper: AttestationsWrapper,
  phoneHashDetails: PhoneNumberHashDetails,
  account: string,
  attestations: ActionableAttestation[],
  securityCodeWithPrefix: string
) {
  const securityCodePrefix = parseInt(securityCodeWithPrefix[0], 10)
  const lookupAttestations = attestations.filter(
    (attestation) => hashAddressToSingleDigit(attestation.issuer) === securityCodePrefix
  )

  // Recover the full attestation code from the matching issuer's attestation services
  return raceUntilSuccess(
    lookupAttestations.map(async (attestation: ActionableAttestation) =>
      requestValidator(
        attestationsWrapper,
        account,
        phoneHashDetails,
        attestation,
        securityCodeWithPrefix.substr(1) // remove prefix
      )
    )
  )
}

async function requestValidator(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation,
  securityCode: string
): Promise<string> {
  const issuer = attestation.issuer
  Logger.debug(
    TAG + '@getAttestationCodeFromSecurityCode',
    `Revealing an attestation for issuer: ${issuer}`
  )
  try {
    const requestBody: GetAttestationRequest = {
      account,
      issuer: attestation.issuer,
      phoneNumber: phoneHashDetails.e164Number,
      salt: phoneHashDetails.pepper,
      securityCode,
    }

    const response = await attestationsWrapper.getAttestationForSecurityCode(
      attestation.attestationServiceURL,
      requestBody
    )
    const { ok, status } = response
    if (ok) {
      const body = await response.json()
      if (body.attestationCode) {
        return body.attestationCode
      }
    }
    throw new Error(`Error getting security code for ${issuer}. Status code: ${status}`)
  } catch (error) {
    Logger.error(
      TAG + '@getAttestationCodeFromSecurityCode',
      `get for issuer ${issuer} failed`,
      error
    )
    throw error
  }
}
