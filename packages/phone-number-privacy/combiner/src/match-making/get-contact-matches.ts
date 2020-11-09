import {
  authenticateUser,
  ErrorMessage,
  hasValidAccountParam,
  hasValidContractPhoneNumbersParam,
  hasValidPhoneNumberHash,
  hasValidUserPhoneNumberParam,
  isVerified,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'firebase-functions'
import { respondWithError } from '../common/error-utils'
import { Counters, Histograms } from '../common/metrics'
import { VERSION } from '../config'
import { getDidMatchmaking, setDidMatchmaking } from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'
import { getContractKit } from '../web3/contracts'

interface GetContactMatchesRequest {
  account: string
  userPhoneNumber: string
  contactPhoneNumbers: string[]
  hashedPhoneNumber: string
  sessionID?: string
}

interface ContactMatch {
  phoneNumber: string
}

// TODO (amyslawson) consider pagination or streaming of contacts?
export async function handleGetContactMatches(
  request: Request<{}, {}, GetContactMatchesRequest>,
  response: Response
) {
  const logger: Logger = response.locals.logger
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      Counters.responses.labels('400').inc()
      respondWithError(response, 400, WarningMessage.INVALID_INPUT, logger)
      return
    }
    if (!(await authenticateUser(request, getContractKit(), logger))) {
      Counters.responses.labels('401').inc()
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER, logger)
      return
    }

    const { account, userPhoneNumber, contactPhoneNumbers, hashedPhoneNumber } = request.body

    if (!(await isVerified(account, hashedPhoneNumber, getContractKit(), logger))) {
      Counters.responses.labels('403').inc()
      respondWithError(response, 403, WarningMessage.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE, logger)
      return
    }
    if (await getDidMatchmaking(account, logger)) {
      Counters.responses.labels('403').inc()
      respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
      return
    }
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
    ).map((numberPair) => ({ phoneNumber: numberPair }))
    Histograms.percentOfContactsCoveredByMatchmaking.observe(
      matchedContacts.length / contactPhoneNumbers.length
    )
    await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
    await setDidMatchmaking(account, logger)
    response.json({ success: true, matchedContacts, version: VERSION })
  } catch (err) {
    logger.error('Failed to getContactMatches')
    logger.error({ err })
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, logger)
  }
}

function isValidGetContactMatchesInput(requestBody: GetContactMatchesRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidUserPhoneNumberParam(requestBody) &&
    hasValidContractPhoneNumbersParam(requestBody) &&
    hasValidPhoneNumberHash(requestBody)
    // TODO find way to check content body size without RE-JSONifying it
    // isBodyReasonablySized(requestBody)
  )
}
