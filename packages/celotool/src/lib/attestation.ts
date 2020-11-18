import { Address, CeloTransactionParams, ContractKit, OdisUtils } from '@celo/contractkit'
import { AuthSigner } from '@celo/contractkit/lib/identity/odis/query'
import {
  ActionableAttestation,
  AttestationsWrapper
} from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationUtils, PhoneNumberUtils } from '@celo/utils'
import { concurrentMap } from '@celo/utils/lib/async'
import { sample } from 'lodash'
import moment from 'moment'
import { Twilio } from 'twilio'

const DUMMY_SMS_URL = 'https://enzyutth0wxme.x.pipedream.net/'

// Use the supplied salt, or if none supplied, go to ODIS and retrieve a pepper
export async function getIdentifierAndPepper(kit : ContractKit, context : string, account : string, phoneNumber : string, salt : string | null) {
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
  if (unselectedRequest.blockNumber === 0 || (await attestations.isAttestationExpired(unselectedRequest.blockNumber))) {
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
  pepper: string,
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
          url: attestation.attestationServiceURL,
          known: true,
        }
      }

      return
    } catch (error) {
      return {
        error,
        issuer: attestation.issuer,
        url: attestation.attestationServiceURL,
        known: false,
      }
    }
  })
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

// Inefficient, but should be fine for now
// Could mark already checked messages in the future
export async function findValidCode(
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
  salt: string,
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
  salt: string,
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
    }
    catch {
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
