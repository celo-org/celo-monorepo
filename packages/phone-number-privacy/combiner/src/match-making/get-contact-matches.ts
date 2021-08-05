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
import { Request, Response } from 'firebase-functions'
import { respondWithError } from '../common/error-utils'
import { VERSION } from '../config'
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

    let verifiedPhoneNumberDekSig: VerifiedPhoneNumberDekSignature | undefined
    if (signedUserPhoneNumber) {
      try {
        verifiedPhoneNumberDekSig = await verifySignedUserPhoneNumber(
          signedUserPhoneNumber,
          userPhoneNumber,
          account,
          logger
        )
      } catch {
        respondWithError(response, 403, WarningMessage.INVALID_USER_PHONE_NUMBER_SIGNATURE, logger)
        return
      }
    }

    const hasDoneMatchmaking = await getDidMatchmaking(account, logger).catch(() => {
      // If we don't know if the user has performed matchmaking before, we can't ensure the request is valid.
      logger.warn(
        'Failed to determine if user has performed matchmaking. Request will be fulfilled but not recorded.'
      )
      verifiedPhoneNumberDekSig = undefined
      return false
    })
    if (hasDoneMatchmaking) {
      logger.info({ account }, 'Account has performed matchmaking before.')

      const validReplay = await isValidReplay(
        account,
        userPhoneNumber,
        logger,
        signedUserPhoneNumber
      ).catch(() => {
        verifiedPhoneNumberDekSig = undefined
        return true
      })
      if (!validReplay) {
        respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
        return
      }
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

function verifySignedUserPhoneNumber(
  signedUserPhoneNumber: string,
  userPhoneNumber: string,
  account: string,
  logger: Logger
) {
  return getDataEncryptionKey(account, getContractKit(), logger).then(
    (dekSigner) => {
      if (!verifySignature(userPhoneNumber, signedUserPhoneNumber, dekSigner)) {
        throw new Error()
      }
      return { signedUserPhoneNumber, dekSigner } as VerifiedPhoneNumberDekSignature
    },
    () => {
      logger.warn(
        'Failed to retrieve DEK to verify signedUserPhoneNumber. Request wont be recorded.'
      )
      return undefined
    }
  )
}

async function isValidReplay(
  account: string,
  userPhoneNumber: string,
  logger: Logger,
  signedUserPhoneNumber?: string
) {
  if (!signedUserPhoneNumber) {
    // If the account has performed matchmaking before and does not provide their signed phone number in the request,
    // we return an error bc they could be querying matches for a new number that isn't theirs.
    logger.info(
      { account },
      'Blocking account from requerying matches without providing a phone number signature.'
    )
    return false
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
    return true
  }
  if (signedUserPhoneNumberRecord !== signedUserPhoneNumber) {
    if (await userHasNewDek(account, userPhoneNumber, signedUserPhoneNumberRecord, logger)) {
      logger.info({ account }, 'Allowing account to requery matches after key rotation.')
      return true
    }
    logger.info(
      { account },
      'Blocking account from querying matches for a different phone number than before.'
    )
    return false
  }
  logger.info(
    { account },
    'Allowing account to requery matches for the same phone number as before.'
  )
  return true
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
    verifySignature(userPhoneNumber, signedUserPhoneNumberRecord, dekSignerRecord)
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
