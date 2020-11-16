import { notEmpty } from '@celo/base'
import { Address, CeloTransactionParams, ContractKit, OdisUtils } from '@celo/contractkit'
import { AuthSigner } from '@celo/contractkit/lib/identity/odis/query'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import Logger from 'bunyan'
import { sample } from 'lodash'
import moment from 'moment'
import { Twilio } from 'twilio'

const POLLING_WAIT = 300

// Use the supplied salt, or if none supplied, go to ODIS and retrieve a pepper
export async function getIdentifierAndPepper(
  kit: ContractKit,
  context: string,
  account: string,
  phoneNumber: string,
  salt: string | null
) {
  if (salt) {
    return {
      pepper: salt,
      identifier: PhoneNumberUtils.getPhoneHash(phoneNumber, salt!),
    }
  } else {
    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: kit,
    }

    const ret = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      phoneNumber,
      account,
      authSigner,
      OdisUtils.Query.getServiceContext(context)
    )

    return {
      pepper: ret.pepper,
      identifier: ret.phoneHash,
    }
  }
}

export async function requestMoreAttestations(
  attestations: AttestationsWrapper,
  phoneNumber: string,
  attestationsRequested: number,
  account: Address,
  txParams: CeloTransactionParams = {}
) {
  const unselectedRequest = await attestations.getUnselectedRequest(phoneNumber, account)
  if (
    unselectedRequest.blockNumber === 0 ||
    (await attestations.isAttestationExpired(unselectedRequest.blockNumber))
  ) {
    await attestations
      .approveAttestationFee(attestationsRequested)
      .then((txo) => txo.sendAndWaitForReceipt(txParams))
    await attestations
      .request(phoneNumber, attestationsRequested)
      .then((txo) => txo.sendAndWaitForReceipt(txParams))
  }

  const selectIssuers = await attestations.selectIssuersAfterWait(phoneNumber, account)
  await selectIssuers.sendAndWaitForReceipt(txParams)
}

type RequestAttestationError =
  | undefined
  | { status: number; text: string; issuer: string; name: string | undefined; known: true }
  | { error: any; issuer: string; known: false }

export async function requestAttestationsFromIssuers(
  attestationsToReveal: ActionableAttestation[],
  attestations: AttestationsWrapper,
  phoneNumber: string,
  account: string,
  pepper: string
): Promise<RequestAttestationError[]> {
  return concurrentMap(5, attestationsToReveal, async (attestation) => {
    try {
      const response = await attestations.revealPhoneNumberToIssuer(
        phoneNumber,
        account,
        attestation.issuer,
        attestation.attestationServiceURL,
        pepper
      )
      if (!response.ok) {
        return {
          status: response.status,
          text: await response.text(),
          issuer: attestation.issuer,
          name: attestation.name,
          known: true,
        }
      }

      return
    } catch (error) {
      return { error, issuer: attestation.issuer, known: false }
    }
  })
}

export async function reportErrors(possibleErrors: RequestAttestationError[], logger: Logger) {
  logger.info(
    { possibleErrors: possibleErrors.filter((_) => _ && _.known).length },
    'Reveal errors'
  )

  possibleErrors.filter(notEmpty).forEach((error) => {
    if (error.known) {
      logger.info({ ...error }, 'Error while requesting from attestation service')
    } else {
      logger.info({ ...error }, 'Unknown error while revealing to issuer')
    }
  })
}

// Inefficient, but should be fine for now
// Could mark already checked messages in the future
async function findValidCode(
  attestations: AttestationsWrapper,
  messages: string[],
  identifier: string,
  attestationsToComplete: ActionableAttestation[],
  account: string
) {
  for (const message of messages) {
    try {
      const code = AttestationUtils.extractAttestationCodeFromMessage(message)
      if (!code) {
        continue
      }

      const issuer = await attestations.findMatchingIssuer(
        identifier,
        account,
        code,
        attestationsToComplete.map((_) => _.issuer)
      )

      if (!issuer) {
        continue
      }

      const isValid = await attestations.validateAttestationCode(identifier, account, issuer, code)

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

export async function getPhoneNumber(twilioClient: Twilio, addressSid: string) {
  const phoneNumber = await chooseFromAvailablePhoneNumbers(twilioClient)

  if (phoneNumber !== undefined) {
    return phoneNumber
  }

  return createPhoneNumber(twilioClient, addressSid)
}

async function chooseFromAvailablePhoneNumbers(twilioClient: Twilio) {
  const availableNumbers = await twilioClient.incomingPhoneNumbers.list()
  const usableNumber = availableNumbers[0]
  return usableNumber
}
async function createPhoneNumber(twilioClient: Twilio, addressSid: string) {
  const countryCodes = ['GB', 'US']
  const countryCode = sample(countryCodes)
  const context = await twilioClient.availablePhoneNumbers.get(countryCode!)
  const numbers = await context.mobile.list({ limit: 10 })
  const usableNumber = numbers[0]

  await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: usableNumber!.phoneNumber,
    addressSid,
    // Just an requestbin.com endpoint to avoid errors
    smsUrl: 'https://enzyutth0wxme.x.pipedream.net/',
  })

  return usableNumber
}

async function fetchLatestMessagesFromToday(client: Twilio, phoneNumber: string, count: number) {
  return client.messages.list({
    to: phoneNumber,
    pageSize: count,
    // Twilio keeps track of dates in UTC so it could be yesterday too
    dateSentAfter: moment()
      .subtract(2, 'day')
      .toDate(),
  })
}

export async function pollForMessagesAndCompleteAttestations(
  attestations: AttestationsWrapper,
  client: Twilio,
  phoneNumber: string,
  identifier: string,
  account: Address,
  attestationsToComplete: ActionableAttestation[],
  txParams: CeloTransactionParams = {},
  logger: Logger,
  timeToPollForTextMessages: number
) {
  const startDate = moment()
  logger.info({ pollingWait: POLLING_WAIT }, 'Poll for the attestation code')
  while (
    moment.duration(moment().diff(startDate)).asMinutes() < timeToPollForTextMessages &&
    attestationsToComplete.length > 0
  ) {
    const messages = await fetchLatestMessagesFromToday(client, phoneNumber, 100)

    const res = await findValidCode(
      attestations,
      messages.map((_) => _.body),
      identifier,
      attestationsToComplete,
      account
    )

    if (!res) {
      await sleep(POLLING_WAIT)
      continue
    }

    logger.info(
      { waitingTime: moment.duration(moment().diff(startDate)).asSeconds() },
      'Received valid code'
    )

    const completeTx = await attestations.complete(identifier, account, res.issuer, res.code)

    await completeTx.sendAndWaitForReceipt(txParams)

    logger.info({ issuer: res.issuer, identifier, account }, 'Completed attestation')
    attestationsToComplete = await attestations.getActionableAttestations(identifier, account)
  }
}
