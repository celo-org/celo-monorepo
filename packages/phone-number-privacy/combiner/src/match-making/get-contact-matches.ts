import {
  authenticateUser,
  ErrorMessage,
  ErrorType,
  GetContactMatchesRequest,
  getDataEncryptionKey,
  hasValidAccountParam,
  hasValidContactPhoneNumbersParam,
  hasValidIdentifier,
  hasValidUserPhoneNumberParam,
  isVerified,
  respondWithError,
  verifyDEKSignature,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'firebase-functions'
import { Knex } from 'knex'
import config, {
  E2E_TEST_ACCOUNTS,
  E2E_TEST_PHONE_NUMBERS,
  FORNO_ALFAJORES,
  VERSION,
} from '../config'
import {
  getAccountSignedUserPhoneNumberRecord,
  getDekSignerRecord,
  getDidMatchmaking,
  setDidMatchmaking,
} from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'
import { getContractKit } from '../web3/contracts'

interface ContactMatch {
  phoneNumber: string
}
export interface VerifiedPhoneNumberDekSignature {
  signedUserPhoneNumber: string
  dekSigner: string
}

function sendFailureResponse(response: Response, error: ErrorType, status: number, logger: Logger) {
  respondWithError(
    response,
    {
      success: false,
      version: VERSION,
      error,
    },
    status,
    logger
  )
}

export async function handleGetContactMatches(db: Knex, request: Request, response: Response) {
  const logger: Logger = response.locals.logger
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      sendFailureResponse(response, WarningMessage.INVALID_INPUT, 400, logger)
      return
    }

    // TODO: this error handling shouldn't be necessary here but there is a bug in the common package's
    // error handling. Remove this or refactor once that bug is resolved.
    let isAuthenticated = true // We assume user is authenticated on Forno errors
    try {
      isAuthenticated = await authenticateUser(request, getContractKit(), logger)
    } catch {
      logger.error('Forno error caught in handleGetContactMatches line 57') // Temporary for debugging
      logger.error(ErrorMessage.CONTRACT_GET_FAILURE)
    }
    if (!isAuthenticated) {
      sendFailureResponse(response, WarningMessage.UNAUTHENTICATED_USER, 401, logger)
      return
    }

    const {
      account,
      userPhoneNumber,
      contactPhoneNumbers,
      hashedPhoneNumber,
      signedUserPhoneNumber,
    } = request.body

    if (!shouldBypassVerificationForE2ETesting(userPhoneNumber, account)) {
      // TODO: this error handling shouldn't be necessary here but there is a bug in the common package's
      // error handling. Remove this or refactor once that bug is resolved.
      let _isVerified = true // We assume user is authenticated on Forno errors
      try {
        _isVerified = await isVerified(account, hashedPhoneNumber, getContractKit(), logger)
      } catch {
        logger.error('Forno error caught in handleGetContactMatches line 80') // Temporary for debugging
        logger.error(ErrorMessage.CONTRACT_GET_FAILURE)
      }
      if (!_isVerified) {
        sendFailureResponse(
          response,
          WarningMessage.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE,
          403,
          logger
        )
        return
      }
    } else {
      logger.warn(
        { account, userPhoneNumber },
        'Allowing request to bypass verification for e2e testing'
      )
    }

    // If we are unsure whether a phone number signature is valid but we don't want to block the user,
    // we just set verifiedPhoneNumberDekSig to undefined so that it is not stored in the database
    // and fulfill the request as usual.
    let verifiedPhoneNumberDekSig: VerifiedPhoneNumberDekSignature | undefined
    if (signedUserPhoneNumber) {
      // TODO: this error handling shouldn't be necessary here but there is a bug in the common package's
      // error handling. Remove this or refactor once that bug is resolved.
      let dekSigner = ''
      try {
        dekSigner = await getDataEncryptionKey(account, getContractKit(), logger)
      } catch {
        logger.error(ErrorMessage.CONTRACT_GET_FAILURE)
        logger.warn(
          'Failed to retrieve DEK to verify signedUserPhoneNumber. Request wont be recorded.'
        )
        logger.error('Forno error caught in handleGetContactMatches line 109') // Temporary for debugging
      }
      if (dekSigner) {
        if (
          !verifyDEKSignature(userPhoneNumber, signedUserPhoneNumber, dekSigner, logger, {
            insecureAllowIncorrectlyGeneratedSignature: true,
          })
        ) {
          sendFailureResponse(
            response,
            WarningMessage.INVALID_USER_PHONE_NUMBER_SIGNATURE,
            403,
            logger
          )
          return
        }
        verifiedPhoneNumberDekSig = { dekSigner, signedUserPhoneNumber }
      }
    }

    const invalidReplay = await isInvalidReplay(
      db,
      account,
      userPhoneNumber,
      logger,
      signedUserPhoneNumber
    ).catch(() => {
      logger.warn(
        'Failed to determine that user is not requerying matches for a new number. Fullfilling request without recording signature.'
      )
      verifiedPhoneNumberDekSig = undefined
    })
    if (invalidReplay) {
      sendFailureResponse(response, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, 403, logger)
      return
    }

    await finishMatchmaking(
      db,
      account,
      userPhoneNumber,
      contactPhoneNumbers,
      response,
      logger,
      verifiedPhoneNumberDekSig
    )
  } catch (err) {
    logger.error('Failed to getContactMatches')
    logger.error(err)
    sendFailureResponse(response, ErrorMessage.UNKNOWN_ERROR, 500, logger)
  }
}

async function finishMatchmaking(
  db: Knex,
  account: string,
  userPhoneNumber: string,
  contactPhoneNumbers: string[],
  response: Response,
  logger: Logger,
  verifiedPhoneNumberDekSig?: VerifiedPhoneNumberDekSignature
) {
  const matchedContacts: ContactMatch[] = (
    await getNumberPairContacts(db, userPhoneNumber, contactPhoneNumbers, logger)
  ).map((numberPair) => ({ phoneNumber: numberPair }))
  logger.info(
    {
      percentageOfContactsCoveredByMatchmaking: matchedContacts.length / contactPhoneNumbers.length,
    },
    'measured percentage of contacts covered by matchmaking'
  )
  await setNumberPairContacts(db, userPhoneNumber, contactPhoneNumbers, logger)
  await setDidMatchmaking(db, account, logger, verifiedPhoneNumberDekSig)
  response.json({ success: true, matchedContacts, version: VERSION })
}

async function isReplay(db: Knex, account: string, logger: Logger): Promise<boolean> {
  return getDidMatchmaking(db, account, logger).catch((err) => {
    logger.warn('Failed to determine if user has performed matchmaking.')
    throw err
  })
}

async function isInvalidReplay(
  db: Knex,
  account: string,
  userPhoneNumber: string,
  logger: Logger,
  signedUserPhoneNumber?: string
) {
  if (!(await isReplay(db, account, logger))) {
    return false
  }
  if (!signedUserPhoneNumber) {
    // If the account has performed matchmaking before and does not provide their signed phone number in the request,
    // we return an error bc they could be querying matches for a new number that isn't theirs.
    logger.info(
      { account },
      'Blocking account from requerying matches without providing a phone number signature.'
    )
    return true
  }
  const signedUserPhoneNumberRecord = await getAccountSignedUserPhoneNumberRecord(
    db,
    account,
    logger
  ).catch((err) => {
    logger.warn(
      { account },
      'Allowing account to perform matchmaking due to db error finding phone number record. We will not record their phone number this time.'
    )
    throw err
  })
  if (!signedUserPhoneNumberRecord) {
    logger.info(
      { account },
      'Allowing account to perform matchmaking since we have no record of the phone number it used before.'
    )
    return false
  }
  if (signedUserPhoneNumberRecord !== signedUserPhoneNumber) {
    if (await userHasNewDek(db, account, userPhoneNumber, signedUserPhoneNumberRecord, logger)) {
      logger.info({ account }, 'Allowing account to requery matches after key rotation.')
      return false
    }
    logger.info(
      { account },
      'Blocking account from querying matches for a different phone number than before.'
    )
    return true
  }
  logger.info(
    { account },
    'Allowing account to requery matches for the same phone number as before.'
  )
  return false
}

async function userHasNewDek(
  db: Knex,
  account: string,
  userPhoneNumber: string,
  signedUserPhoneNumberRecord: string,
  logger: Logger
): Promise<boolean> {
  const dekSignerRecord = await getDekSignerRecord(db, account, logger)
  const isKeyRotation =
    !!dekSignerRecord &&
    verifyDEKSignature(userPhoneNumber, signedUserPhoneNumberRecord, dekSignerRecord, logger, {
      insecureAllowIncorrectlyGeneratedSignature: true,
    })
  if (isKeyRotation) {
    logger.info(
      {
        account,
        dekSignerRecord,
      },
      'User has rotated their dek since first requesting matches.'
    )
  }
  return isKeyRotation
}

function isValidGetContactMatchesInput(requestBody: GetContactMatchesRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidUserPhoneNumberParam(requestBody) &&
    hasValidContactPhoneNumbersParam(requestBody) &&
    hasValidIdentifier(requestBody)
  )
}

function shouldBypassVerificationForE2ETesting(userPhoneNumber: string, account: string): boolean {
  return (
    config.blockchain.provider === FORNO_ALFAJORES &&
    E2E_TEST_PHONE_NUMBERS.includes(userPhoneNumber) &&
    E2E_TEST_ACCOUNTS.includes(account)
  )
}
