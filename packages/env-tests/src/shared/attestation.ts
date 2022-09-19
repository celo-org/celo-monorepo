import { notEmpty } from '@celo/base'
import { Address, CeloTransactionParams } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
  getSecurityCodePrefix,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { PhoneNumberUtils } from '@celo/phone-utils'
import { AttestationRequest } from '@celo/phone-utils/lib/io'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { AttestationUtils } from '@celo/utils/lib/attestations'
import Logger from 'bunyan'
import { sample } from 'lodash'
import moment from 'moment'
import { Twilio } from 'twilio'

const POLLING_WAIT = 300

export type RequestAttestationError =
  | undefined
  | { status: number; text: string; issuer: string; name: string | undefined; known: true }
  | { error: any; issuer: string; known: false }

export async function requestAttestationsFromIssuers(
  attestationsToReveal: ActionableAttestation[],
  attestations: AttestationsWrapper,
  phoneNumber: string,
  account: string,
  pepper: string,
  securityCode?: boolean
): Promise<RequestAttestationError[]> {
  return concurrentMap(5, attestationsToReveal, async (attestation) => {
    try {
      const revealRequest: AttestationRequest = {
        phoneNumber,
        account,
        issuer: attestation.issuer,
        salt: pepper,
        smsRetrieverAppSig: undefined,
        securityCodePrefix: securityCode ? getSecurityCodePrefix(attestation.issuer) : undefined,
        language: undefined,
        phoneNumberSignature: undefined,
      }

      const response = await attestations.revealPhoneNumberToIssuer(
        attestation.attestationServiceURL,
        revealRequest
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
  pepper: string,
  phoneNumber: string,
  attestationsToComplete: ActionableAttestation[],
  account: string
) {
  for (const message of messages) {
    try {
      let attestationCode: string | null

      const securityCode = AttestationUtils.extractSecurityCodeWithPrefix(message)
      if (securityCode) {
        // optimisation code implemented to reduce possibility
        // of hitting wrong service
        const possibleIssuers = attestationsToComplete.filter(
          (a) => getSecurityCodePrefix(a.issuer) === securityCode[0]
        )

        const attestationCodeDeepLink = (
          await Promise.all(
            possibleIssuers.map((a) =>
              attestations
                .getAttestationForSecurityCode(
                  a.attestationServiceURL,
                  {
                    account,
                    issuer: a.issuer,
                    phoneNumber,
                    salt: pepper,
                    securityCode: securityCode.slice(1),
                  },
                  account
                )
                // hit the wrong service
                .catch(() => null)
            )
          )
        ).find(Boolean)
        if (!attestationCodeDeepLink) {
          continue
        }
        attestationCode =
          AttestationUtils.extractAttestationCodeFromMessage(attestationCodeDeepLink)
      } else {
        attestationCode = AttestationUtils.extractAttestationCodeFromMessage(message)
      }

      if (!attestationCode) {
        continue
      }

      const issuer = await attestations.findMatchingIssuer(
        identifier,
        account,
        attestationCode,
        attestationsToComplete.map((_) => _.issuer)
      )

      if (!issuer) {
        continue
      }

      const isValid = await attestations.validateAttestationCode(
        identifier,
        account,
        issuer,
        attestationCode
      )
      if (!isValid) {
        continue
      }

      return { code: attestationCode, issuer }
    } catch {
      continue
    }
  }

  return
}

export async function pollForMessagesAndCompleteAttestations(
  attestations: AttestationsWrapper,
  client: Twilio,
  phoneNumber: string,
  identifier: string,
  pepper: string,
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
      pepper,
      phoneNumber,
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

// Use the supplied pepper, or if none supplied, go to ODIS and retrieve a pepper
export async function getIdentifierAndPepper(
  kit: ContractKit,
  context: string,
  account: string,
  phoneNumber: string,
  pepper: string | null
) {
  if (pepper) {
    return {
      pepper,
      identifier: PhoneNumberUtils.getPhoneHash(phoneNumber, pepper),
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
  const context = twilioClient.availablePhoneNumbers.get(countryCode!)
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

export async function fetchLatestMessagesFromToday(
  client: Twilio,
  phoneNumber: string,
  count: number
) {
  return client.messages.list({
    to: phoneNumber,
    pageSize: count,
    // Twilio keeps track of dates in UTC so it could be yesterday too
    dateSentAfter: moment().subtract(2, 'day').toDate(),
  })
}
