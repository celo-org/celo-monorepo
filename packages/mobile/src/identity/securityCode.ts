import {
  ActionableAttestation,
  AttestationServiceSecurityCodeRequest,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/contractkit/src/identity/odis/phone-number-identifier'
import { Address } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import Logger from 'src/utils/Logger'

const TAG = 'identity/securityCode'

function hashAddressToSingleDigit(address: Address): number {
  return new BigNumber(address.toLowerCase()).modulo(10).toNumber()
}

export function getSecurityCodePrefix(issuerAddress: Address) {
  return `${hashAddressToSingleDigit(issuerAddress)}`
}

export function extractSecurityCodeWithPrefix(message: string) {
  const matches = message.match('\\s(\\d{8})\\s')
  if (matches && matches.length === 2) {
    return matches[1]
  }
  return null
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

  for (const attestation of lookupAttestations) {
    // Try to recover the full attestation code from the matching issuer's attestation service
    try {
      const message = await requestValidator(
        attestationsWrapper,
        account,
        phoneHashDetails,
        attestation,
        securityCodeWithPrefix.substr(1) // remove prefix
      )
      return message
    } catch (e) {
      Logger.warn(
        TAG + '@getAttestationCodeForSecurityCode',
        'Getting attestation code for security code error: ',
        e
      )
      continue
    }
  }
}

async function requestValidator(
  attestationsWrapper: AttestationsWrapper,
  account: string,
  phoneHashDetails: PhoneNumberHashDetails,
  attestation: ActionableAttestation,
  securityCode: string
) {
  const issuer = attestation.issuer
  Logger.debug(
    TAG + '@getAttestationCodeFromSecurityCode',
    `Revealing an attestation for issuer: ${issuer}`
  )
  try {
    const requestBody: AttestationServiceSecurityCodeRequest = {
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
    const body = await response.json()
    if (ok && body.attestationCode) {
      return body.attestationCode
    }

    throw new Error(`Error getting security code for ${issuer}. Status code: ${status}`)
  } catch (error) {
    Logger.error(
      TAG + '@getAttestationCodeFromSecurityCode',
      `get for issuer ${issuer} failed`,
      error
    )
    return false
  }
}
