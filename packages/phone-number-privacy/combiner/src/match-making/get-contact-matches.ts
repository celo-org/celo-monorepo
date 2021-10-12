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
import { trimLeading0x } from '@celo/utils/lib/address'
import Logger from 'bunyan'
import { ec as EC } from 'elliptic'
import { Request, Response } from 'firebase-functions'
import { respondWithError } from '../common/error-utils'
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

const ec = new EC('secp256k1')

interface ContactMatch {
  phoneNumber: string
}
export interface VerifiedPhoneNumberDekSignature {
  signedUserPhoneNumber: string
  dekSigner: string
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

    if (!shouldBypassVerificationForE2ETesting(userPhoneNumber, account)) {
      if (!(await isVerified(account, hashedPhoneNumber, getContractKit(), logger))) {
        respondWithError(response, 403, WarningMessage.UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE, logger)
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
      const dekSigner = await getDataEncryptionKey(account, getContractKit(), logger).catch(() => {
        logger.warn(
          'Failed to retrieve DEK to verify signedUserPhoneNumber. Request wont be recorded.'
        )
      })
      if (dekSigner) {
        if (!verifyDEKSignature(userPhoneNumber, signedUserPhoneNumber, dekSigner, logger)) {
          respondWithError(
            response,
            403,
            WarningMessage.INVALID_USER_PHONE_NUMBER_SIGNATURE,
            logger
          )
          return
        }
        verifiedPhoneNumberDekSig = { dekSigner, signedUserPhoneNumber }
      }
    }

    const invalidReplay = await isInvalidReplay(
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
      respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
      return
    }

    await finishMatchmaking(
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
    respondWithError(response, 500, ErrorMessage.UNKNOWN_ERROR, logger)
  }
}

async function finishMatchmaking(
  account: string,
  userPhoneNumber: string,
  contactPhoneNumbers: string[],
  response: Response,
  logger: Logger,
  verifiedPhoneNumberDekSig?: VerifiedPhoneNumberDekSignature
) {
  const matchedContacts: ContactMatch[] = (
    await getNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
  ).map((numberPair) => ({ phoneNumber: numberPair }))
  logger.info(
    {
      percentageOfContactsCoveredByMatchmaking: matchedContacts.length / contactPhoneNumbers.length,
    },
    'measured percentage of contacts covered by matchmaking'
  )
  await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
  await setDidMatchmaking(account, logger, verifiedPhoneNumberDekSig)
  response.json({ success: true, matchedContacts, version: VERSION })
}

async function isReplay(account: string, logger: Logger): Promise<boolean> {
  return getDidMatchmaking(account, logger).catch((err) => {
    logger.warn('Failed to determine if user has performed matchmaking.')
    throw err
  })
}

async function isInvalidReplay(
  account: string,
  userPhoneNumber: string,
  logger: Logger,
  signedUserPhoneNumber?: string
) {
  if (!(await isReplay(account, logger))) {
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
    if (await userHasNewDek(account, userPhoneNumber, signedUserPhoneNumberRecord, logger)) {
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

export function verifyDEKSignature(
  message: string,
  messageSignature: string,
  registeredEncryptionKey: string,
  logger?: Logger
) {
  try {
    const key = ec.keyFromPublic(trimLeading0x(registeredEncryptionKey), 'hex')
    return key.verify(message, JSON.parse(messageSignature))
  } catch (err) {
    if (logger) {
      logger.error('Failed to verify signature with DEK')
      logger.error({ err, dek: registeredEncryptionKey })
    }
    return false
  }
}

async function userHasNewDek(
  account: string,
  userPhoneNumber: string,
  signedUserPhoneNumberRecord: string,
  logger: Logger
): Promise<boolean> {
  const dekSignerRecord = await getDekSignerRecord(account, logger)
  const isKeyRotation =
    !!dekSignerRecord &&
    verifyDEKSignature(userPhoneNumber, signedUserPhoneNumberRecord, dekSignerRecord, logger)
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
