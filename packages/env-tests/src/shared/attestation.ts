import { notEmpty } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { AuthSigner, OdisContextName } from '@celo/identity/lib/odis/query'
import { PhoneNumberUtils } from '@celo/phone-utils'
import Logger from 'bunyan'
import moment from 'moment'
import { Twilio } from 'twilio'

export type RequestAttestationError =
  | undefined
  | { status: number; text: string; issuer: string; name: string | undefined; known: true }
  | { error: any; issuer: string; known: false }

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
      OdisUtils.Query.getServiceContext(context as OdisContextName)
    )

    return {
      pepper: ret.pepper,
      identifier: ret.phoneHash,
    }
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
    dateSentAfter: moment().subtract(2, 'day').toDate(),
  })
}
