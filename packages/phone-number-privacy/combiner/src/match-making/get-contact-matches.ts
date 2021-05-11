import {
  authenticateUser,
  ErrorMessage,
  GetContactMatchesRequest,
  hasValidAccountParam,
  hasValidContactPhoneNumbersParam,
  hasValidUserPhoneNumberParam,
  isVerified,
  phoneNumberHashIsValidIfExists,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'firebase-functions'
import { respondWithError } from '../common/error-utils'
import { VERSION } from '../config'
import { getDidMatchmaking, setDidMatchmaking } from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'
import { getContractKit } from '../web3/contracts'

interface ContactMatch {
  phoneNumber: string
}

export async function handleGetContactMatches(
  request: Request<{}, {}, GetContactMatchesRequest>,
  response: Response
) {
  const logger: Logger = response.locals.logger
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      respondWithError(response, 400, WarningMessage.INVALID_INPUT, logger)
      return
    }
    if (!(await authenticateUser(request, getContractKit(), logger))) {
      respondWithError(response, 401, WarningMessage.UNAUTHENTICATED_USER, logger)
      return
    }

    const { account, userPhoneNumber, contactPhoneNumbers, hashedPhoneNumber } = request.body

    if (!(await isVerified(account, hashedPhoneNumber, getContractKit(), logger))) {
      respondWithError(response, 403, WarningMessage.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE, logger)
      return
    }
    if (await getDidMatchmaking(account, logger)) {
      respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
      return
    }
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
    ).map((numberPair) => ({ phoneNumber: numberPair }))
    logger.info(
      {
        percentageOfContactsCoveredByMatchmaking:
          matchedContacts.length / contactPhoneNumbers.length,
      },
      'measured percentage of contacts covered by matchmaking'
    )
    await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
    await setDidMatchmaking(account, logger)
    response.json({ success: true, matchedContacts, version: VERSION })
  } catch (err) {
    logger.error('Failed to getContactMatches')
    logger.error(err)
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, logger)
  }
}

function isValidGetContactMatchesInput(requestBody: GetContactMatchesRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidUserPhoneNumberParam(requestBody) &&
    hasValidContactPhoneNumbersParam(requestBody) &&
    !!requestBody.hashedPhoneNumber &&
    phoneNumberHashIsValidIfExists(requestBody)
  )
}
