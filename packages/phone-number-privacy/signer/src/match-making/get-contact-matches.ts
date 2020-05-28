import { Request, Response } from 'firebase-functions'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser, isVerified } from '../common/identity'
import {
  hasValidAccountParam,
  hasValidContractPhoneNumbersParam,
  hasValidUserPhoneNumberParam,
  isBodyReasonablySized,
} from '../common/input-validation'
import logger from '../common/logger'
import { getDidMatchmaking, setDidMatchmaking } from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'

// TODO (amyslawson) consider pagination or streaming of contacts?
export async function handleGetContactMatches(request: Request, response: Response) {
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    if (!authenticateUser(request)) {
      respondWithError(response, 401, ErrorMessages.UNAUTHENTICATED_USER)
      return
    }
    if (!(await isVerified(request.body.account, request.body.userPhoneNumber))) {
      respondWithError(response, 403, ErrorMessages.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE)
      return
    }
    if (await getDidMatchmaking(request.body.account)) {
      respondWithError(response, 403, ErrorMessages.DUPLICATE_REQUEST_TO_MATCHMAKE)
      return
    }
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    ).map((numberPair) => ({ phoneNumber: numberPair }))
    await setNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    await setDidMatchmaking(request.body.account)
    response.json({ success: true, matchedContacts })
  } catch (e) {
    logger.error('Failed to getContactMatches', e)
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

interface ContactMatch {
  phoneNumber: string
}

function isValidGetContactMatchesInput(requestBody: any): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidUserPhoneNumberParam(requestBody) &&
    hasValidContractPhoneNumbersParam(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}
