import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { RequestAttestationError } from '@celo/env-tests/lib/shared/attestation'
import { PhoneNumberUtils } from '@celo/phone-utils'
import { sample } from 'lodash'
import { Twilio } from 'twilio'

const DUMMY_SMS_URL = 'https://enzyutth0wxme.x.pipedream.net/'

export async function findSuitableNumber(
  attestations: AttestationsWrapper,
  numbers: string[],
  maximumNumberOfAttestations: number,
  salt: string,
  clientAddress: string
) {
  for (const number of numbers) {
    const phoneHash = PhoneNumberUtils.getPhoneHash(number, salt)
    const stats = await attestations.getAttestationStat(phoneHash, clientAddress)
    if (stats.total < maximumNumberOfAttestations) {
      return number
    }
  }
  return undefined
}

export async function createPhoneNumber(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  maximumNumberOfAttestations: number,
  salt: string,
  clientAddress: string
) {
  const countryCodes = ['GB', 'US']
  let attempts = 0
  while (true) {
    const countryCode = sample(countryCodes)
    const context = await twilioClient.availablePhoneNumbers.get(countryCode!)
    let numbers
    try {
      numbers = await context.mobile.list({ limit: 100 })
    } catch {
      // Some geos inc US appear to have no 'mobile' subcategory.
      numbers = await context.local.list({ limit: 100 })
    }

    const usableNumber = await findSuitableNumber(
      attestations,
      numbers.map((number) => number.phoneNumber),
      maximumNumberOfAttestations,
      salt,
      clientAddress
    )
    if (!usableNumber) {
      if (attempts > 10) {
        throw new Error('Could not find suitable number')
      }
      {
        attempts += 1
        continue
      }
    }

    await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: usableNumber,
      // Just an requestbin.com endpoint to avoid errors
      smsUrl: DUMMY_SMS_URL,
    })

    return usableNumber
  }
}

export function printAndIgnoreRequestErrors(possibleErrors: RequestAttestationError[]) {
  for (const possibleError of possibleErrors) {
    if (possibleError) {
      if (possibleError.known) {
        console.info(
          `Error while requesting from issuer ${possibleError.issuer} ${
            possibleError.name ? `(Name: ${possibleError.name})` : ''
          }. Returned status ${possibleError.status} with response: ${
            possibleError.text
          }. Ignoring.`
        )
      } else {
        console.info(
          `Unknown error while requesting from ${
            possibleError.issuer
          }: ${possibleError.error.toString()}. Ignoring.`
        )
      }
    }
  }
}

export async function getPhoneNumber(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  maximumNumberOfAttestations: number,
  salt: string,
  clientAddress: string
) {
  const phoneNumber = await chooseFromAvailablePhoneNumbers(
    attestations,
    twilioClient,
    maximumNumberOfAttestations,
    salt,
    clientAddress
  )

  if (phoneNumber !== undefined) {
    return phoneNumber
  }

  return createPhoneNumber(
    attestations,
    twilioClient,
    maximumNumberOfAttestations,
    salt,
    clientAddress
  )
}

export async function chooseFromAvailablePhoneNumbers(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  maximumNumberOfAttestations: number,
  salt: string,
  clientAddress: string
) {
  const availableNumbers = (await twilioClient.incomingPhoneNumbers.list()).filter(
    (number) => number.smsUrl === DUMMY_SMS_URL
  )
  if (!availableNumbers?.length) {
    return undefined
  }

  const usableNumber = await findSuitableNumber(
    attestations,
    availableNumbers.map((number) => number.phoneNumber),
    maximumNumberOfAttestations,
    salt,
    clientAddress
  )
  return usableNumber
}
