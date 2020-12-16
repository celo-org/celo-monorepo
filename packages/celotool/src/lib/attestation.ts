import { notEmpty } from '@celo/base'
import { Address, CeloTransactionParams } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper, getSecurityCodePrefix
} from '@celo/contractkit/lib/wrappers/Attestations'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { concurrentMap, sleep } from '@celo/utils/lib/async'
import { AttestationRequest } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import { sample } from 'lodash'
import moment from 'moment'
import { Twilio } from 'twilio'


const POLLING_WAIT = 300





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
                .getAttestationForSecurityCode(a.attestationServiceURL, {
                  account,
                  issuer: a.issuer,
                  phoneNumber,
                  salt: pepper,
                  securityCode: securityCode.slice(1),
                })
                // hit the wrong service
                .catch((_) => null)
            )
          )
        ).find(Boolean)
        if (!attestationCodeDeepLink) {
          continue
        }
        attestationCode = AttestationUtils.extractAttestationCodeFromMessage(
          attestationCodeDeepLink
        )
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


const DUMMY_SMS_URL = 'https://enzyutth0wxme.x.pipedream.net/'

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
  salt: string
) {
  const phoneNumber = await chooseFromAvailablePhoneNumbers(
    attestations,
    twilioClient,
    maximumNumberOfAttestations,
    salt
  )

  if (phoneNumber !== undefined) {
    return phoneNumber
  }

  return createPhoneNumber(attestations, twilioClient, maximumNumberOfAttestations, salt)
}

export async function chooseFromAvailablePhoneNumbers(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  maximumNumberOfAttestations: number,
  salt: string
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
    salt
  )
  return usableNumber
}

async function findSuitableNumber(
  attestations: AttestationsWrapper,
  numbers: string[],
  maximumNumberOfAttestations: number,
  salt: string
) {
  const attestedAccountsLookup = await attestations.lookupIdentifiers(
    numbers.map((n) => PhoneNumberUtils.getPhoneHash(n, salt))
  )
  return numbers.find((number) => {
    const phoneHash = PhoneNumberUtils.getPhoneHash(number, salt)
    const allAccounts = attestedAccountsLookup[phoneHash]

    if (!allAccounts) {
      return true
    }
    const totalAttestations = Object.values(allAccounts)
      .filter((x) => !!x)
      .map((x) => x!.total)
      .reduce((el, sum) => sum + el)

    return totalAttestations < maximumNumberOfAttestations
  })
}

export async function createPhoneNumber(
  attestations: AttestationsWrapper,
  twilioClient: Twilio,
  maximumNumberOfAttestations: number,
  salt: string
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
      salt
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
