import { isValidAddress } from '@celo/utils/lib/address'
import { Request, Response } from 'firebase-functions'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser, isVerified } from '../common/identity'
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
    authenticateUser()
    if (!(await isVerified(request.body.account, request.body.userPhoneNumber))) {
      logger.warn(ErrorMessages.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE)
      respondWithError(response, 403, ErrorMessages.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE)
      return
    }
    if (await getDidMatchmaking(request.body.account)) {
      logger.warn(ErrorMessages.DUPLICATE_REQUEST_TO_MATCHMAKE)
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
    hasValidContractPhoneNumbersParam(requestBody)
  )
}

function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && isValidAddress(requestBody.account)
}

function hasValidUserPhoneNumberParam(requestBody: any): boolean {
  return requestBody.userPhoneNumber
}

function hasValidContractPhoneNumbersParam(requestBody: any): boolean {
  return requestBody.contactPhoneNumbers && Array.isArray(requestBody.contactPhoneNumbers)
}
