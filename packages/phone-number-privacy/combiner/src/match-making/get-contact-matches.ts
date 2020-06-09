import { Request, Response } from 'firebase-functions'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser, isVerified } from '../common/identity'
import {
  hasValidAccountParam,
  hasValidContractPhoneNumbersParam,
  hasValidPhoneNumberHash,
  hasValidUserPhoneNumberParam,
} from '../common/input-validation'
import logger from '../common/logger'
import { getDidMatchmaking, setDidMatchmaking } from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'

interface GetContactMatchesRequest {
  account: string
  userPhoneNumber: string
  contactPhoneNumbers: string[]
  hashedPhoneNumber: string
}

interface ContactMatch {
  phoneNumber: string
}

// TODO (amyslawson) consider pagination or streaming of contacts?
export async function handleGetContactMatches(
  request: Request<{}, {}, GetContactMatchesRequest>,
  response: Response
) {
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    if (!authenticateUser(request)) {
      respondWithError(response, 401, ErrorMessages.UNAUTHENTICATED_USER)
      return
    }

    const { account, userPhoneNumber, contactPhoneNumbers, hashedPhoneNumber } = request.body

    if (!(await isVerified(account, hashedPhoneNumber))) {
      respondWithError(response, 403, ErrorMessages.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE)
      return
    }
    if (await getDidMatchmaking(account)) {
      respondWithError(response, 403, ErrorMessages.DUPLICATE_REQUEST_TO_MATCHMAKE)
      return
    }
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(userPhoneNumber, contactPhoneNumbers)
    ).map((numberPair) => ({ phoneNumber: numberPair }))
    await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers)
    await setDidMatchmaking(account)
    response.json({ success: true, matchedContacts })
  } catch (e) {
    logger.error('Failed to getContactMatches', e)
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
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
