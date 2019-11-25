import { Address, CeloTransactionParams } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberUtils } from '@celo/utils'
import { concurrentMap } from '@celo/utils/lib/async'
import moment from 'moment'
import { Twilio } from 'twilio'

export async function requestMoreAttestations(
  attestations: AttestationsWrapper,
  phoneNumber: string,
  attestationsRequested: number,
  account: Address,
  txParams: CeloTransactionParams = {}
) {
  await attestations
    .approveAttestationFee(attestationsRequested)
    .then((txo) => txo.sendAndWaitForReceipt(txParams))
  await attestations
    .request(phoneNumber, attestationsRequested)
    .then((txo) => txo.sendAndWaitForReceipt(txParams))
  await attestations.waitForSelectingIssuers(phoneNumber, account)
  await attestations.selectIssuers(phoneNumber).then((txo) => txo.sendAndWaitForReceipt(txParams))
}

type RequestAttestationError =
  | undefined
  | { status: number; text: string; issuer: string; known: true }
  | { error: any; issuer: string; known: false }

export async function requestAttestationsFromIssuers(
  attestationsToReveal: ActionableAttestation[],
  attestations: AttestationsWrapper,
  phoneNumber: string,
  account: string
): Promise<RequestAttestationError[]> {
  return concurrentMap(5, attestationsToReveal, async (attestation) => {
    try {
      const response = await attestations.revealPhoneNumberToIssuer(
        phoneNumber,
        account,
        attestation.issuer,
        attestation.attestationServiceURL
      )
      if (!response.ok) {
        return {
          status: response.status,
          text: await response.text(),
          issuer: attestation.issuer,
          known: true,
        }
      }

      return
    } catch (error) {
      return { error: { error }, issuer: attestation.issuer, known: false }
    }
  })
}

export function printAndIgnoreRequestErrors(possibleErrors: RequestAttestationError[]) {
  for (const possibleError of possibleErrors) {
    if (possibleError) {
      if (possibleError.known) {
        console.info(
          `Error while requesting from issuer ${possibleError.issuer}. Returned status ${
            possibleError.status
          } with response: ${possibleError.text}. Ignoring.`
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

// Inefficient, but should be fine for now
// Could mark already checked messages in the future
export async function findValidCode(
  attestations: AttestationsWrapper,
  messages: string[],
  phoneNumber: string,
  attestationsToComplete: ActionableAttestation[],
  account: string
) {
  for (const message of messages) {
    try {
      const code = attestations.extractAttestationCodeFromMessage(message)
      if (!code) {
        continue
      }

      const issuer = await attestations.findMatchingIssuer(
        phoneNumber,
        account,
        code,
        attestationsToComplete.map((_) => _.issuer)
      )

      if (!issuer) {
        continue
      }

      const isValid = await attestations.validateAttestationCode(phoneNumber, account, issuer, code)

      if (!isValid) {
        continue
      }

      return { code, issuer }
    } catch {
      continue
    }
  }

  return
}

export async function getPhoneNumber(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  addressSid: string,
  maximumNumberOfAttestations: number
) {
  const phoneNumber = await chooseFromAvailablePhoneNumbers(
    attestations,
    twilioClient,
    maximumNumberOfAttestations
  )

  if (phoneNumber !== undefined) {
    return phoneNumber
  }

  return createPhoneNumber(attestations, twilioClient, addressSid, maximumNumberOfAttestations)
}

export async function chooseFromAvailablePhoneNumbers(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  maximumNumberOfAttestations: number
) {
  const availableNumbers = await twilioClient.incomingPhoneNumbers.list()
  const usableNumber = await findSuitableNumber(
    attestations,
    availableNumbers.map((number) => number.phoneNumber),
    maximumNumberOfAttestations
  )
  return usableNumber
}

async function findSuitableNumber(
  attestations: AttestationsWrapper,
  numbers: string[],
  maximumNumberOfAttestations: number
) {
  const attestedAccountsLookup = await attestations.lookupPhoneNumbers(
    numbers.map(PhoneNumberUtils.getPhoneHash)
  )
  return numbers.find((number) => {
    const phoneHash = PhoneNumberUtils.getPhoneHash(number)
    const allAccounts = attestedAccountsLookup[phoneHash]

    if (allAccounts === undefined) {
      return true
    }
    const totalAttestations = Object.values(allAccounts)
      .map((x) => x.total)
      .reduce((el, sum) => sum + el)

    return totalAttestations < maximumNumberOfAttestations
  })
}

export async function createPhoneNumber(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  addressSid: string,
  maximumNumberOfAttestations: number
) {
  const usContext = await twilioClient.availablePhoneNumbers.get('GB')
  const numbers = await usContext.mobile.list({ limit: 20 })

  const usableNumber = await findSuitableNumber(
    attestations,
    numbers.map((number) => number.phoneNumber),
    maximumNumberOfAttestations
  )

  if (!usableNumber) {
    throw new Error('Could not find suitable number')
  }

  await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: usableNumber,
    addressSid,
    // We don't really care
    smsUrl: 'https://celo.org',
  })

  return usableNumber
}

export async function fetchLatestMessagesFromToday(
  client: Twilio,
  phoneNumber: string,
  count: number
) {
  return client.messages.list({
    to: phoneNumber,
    pageSize: count,
    // Twilio keeps track of dates in UTC so it could be yesterday too
    dateSentAfter: moment()
      .subtract(2, 'day')
      .toDate(),
  })
}
