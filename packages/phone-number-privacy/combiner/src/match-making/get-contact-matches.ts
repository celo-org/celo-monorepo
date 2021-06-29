import {
  authenticateUser,
  ErrorMessage,
  GetContactMatchesRequest,
  getDataEncryptionKey,
  hasValidAccountParam,
  hasValidContactPhoneNumbersParam,
  hasValidIdentifier,
  hasValidUserPhoneNumberParam,
  isVerified,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import Logger from 'bunyan'
import crypto from 'crypto'
import { Request, Response } from 'firebase-functions'
import { respondWithError } from '../common/error-utils'
import { VERSION } from '../config'
import {
  getAccountSignedUserPhoneNumberRecord,
  getDidMatchmaking,
  setAccountSignedUserPhoneNumberRecord,
  setDidMatchmaking,
} from '../database/wrappers/account'
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

    const {
      account,
      userPhoneNumber,
      contactPhoneNumbers,
      hashedPhoneNumber,
      signedUserPhoneNumber,
    } = request.body

    if (!(await isVerified(account, hashedPhoneNumber, getContractKit(), logger))) {
      respondWithError(response, 403, WarningMessage.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE, logger)
      return
    }

    let signedUserPhoneNumberHash = ''
    let shouldStoreRequest = true
    if (signedUserPhoneNumber) {
      let isValidSig = false
      try {
        isValidSig = await verifySignedUserPhoneNumberSignature(
          account,
          userPhoneNumber,
          signedUserPhoneNumber,
          logger
        )
      } catch (error) {
        if (error.message === ErrorMessage.CONTRACT_GET_FAILURE) {
          logger.warn(
            'Failed to retrieve DEK to verify signedUserPhoneNumber. Signature is assumed valid and request is not recorded.'
          )
          isValidSig = true
          shouldStoreRequest = false
        } else {
          throw error
        }
      }
      if (!isValidSig) {
        respondWithError(response, 403, WarningMessage.INVALID_USER_PHONE_NUMBER_SIGNATURE, logger)
        return
      }
      signedUserPhoneNumberHash = crypto
        .createHash('sha256')
        .update(signedUserPhoneNumber!)
        .digest('base64')
    }

    if (await getDidMatchmaking(account, logger)) {
      logger.info({ account }, 'Account has performed matchmaking before.')
      if (!signedUserPhoneNumber) {
        // If the account has performed matchmaking before and does not provide their signed phone number in the request,
        // we return an error bc they could be querying matches for a new number that isn't theirs.
        logger.info(
          { account },
          'Blocking account from requerying matches without a phone number signature.'
        )
        respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
        return
      } else {
        const signedUserPhoneNumberRecord = await getAccountSignedUserPhoneNumberRecord(
          account,
          logger
        )
        if (!signedUserPhoneNumberRecord) {
          logger.info(
            { account },
            'Allowing account to perform matchmaking since we have no record of the phone number it used before. We will record the phone number this time.'
          )
          if (shouldStoreRequest) {
            await setAccountSignedUserPhoneNumberRecord(account, signedUserPhoneNumberHash, logger)
          }
        } else {
          if (signedUserPhoneNumberRecord !== signedUserPhoneNumberHash) {
            logger.info(
              { account },
              'Blocking account from querying matches for a different phone number than before.'
            )
            respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
            return
          }
          logger.info(
            { account },
            'Allowing account to requery matches for the same phone number as before.'
          )
        }
      }
    } else if (signedUserPhoneNumber) {
      if (shouldStoreRequest) {
        await setAccountSignedUserPhoneNumberRecord(account, signedUserPhoneNumberHash, logger)
      }
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
    if (shouldStoreRequest) {
      await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
      await setDidMatchmaking(account, signedUserPhoneNumberHash, logger)
    }
    response.json({ success: true, matchedContacts, version: VERSION })
  } catch (err) {
    logger.error('Failed to getContactMatches')
    logger.error(err)
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, logger)
  }
}

async function verifySignedUserPhoneNumberSignature(
  account: string,
  userPhoneNumber: string,
  signedUserPhoneNumber: string,
  logger: Logger
) {
  let dek
  try {
    dek = await getDataEncryptionKey(account, getContractKit(), logger)
  } catch (error) {
    throw new Error(ErrorMessage.CONTRACT_GET_FAILURE)
  }
  return verifySignature(userPhoneNumber, signedUserPhoneNumber, dek)
}

function isValidGetContactMatchesInput(requestBody: GetContactMatchesRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidUserPhoneNumberParam(requestBody) &&
    hasValidContactPhoneNumbersParam(requestBody) &&
    hasValidIdentifier(requestBody)
  )
}
