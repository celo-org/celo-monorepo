import {
  authenticateUser,
  ErrorMessage,
  hasValidAccountParam,
  hasValidContractPhoneNumbersParam,
  hasValidPhoneNumberHash,
  hasValidUserPhoneNumberParam,
  isVerified,
  logger,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request, Response } from 'firebase-functions'
import { respondWithError } from '../common/error-utils'
import { VERSION } from '../config'
import { getDidMatchmaking, setDidMatchmaking } from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'
import { getContractKit } from '../web3/contracts'

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
      respondWithError(response, 400, WarningMessage.INVALID_INPUT)
      return
    }
    if (!(await authenticateUser(request, getContractKit()))) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER)
      return
    }

    const { account, userPhoneNumber, contactPhoneNumbers, hashedPhoneNumber } = request.body

    if (!(await isVerified(account, hashedPhoneNumber, getContractKit()))) {
      respondWithError(response, 403, WarningMessage.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE)
      return
    }
    if (await getDidMatchmaking(account)) {
      respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE)
      return
    }
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(userPhoneNumber, contactPhoneNumbers)
    ).map((numberPair) => ({ phoneNumber: numberPair }))
    await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers)
    await setDidMatchmaking(account)
    response.json({ success: true, matchedContacts, version: VERSION })
  } catch (err) {
    logger.error('Failed to getContactMatches')
    logger.error({ err })
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR)
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
