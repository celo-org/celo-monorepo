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
export interface MatchmakingIdentifier {
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

    // If errors prevent us from validating a matchmaking request we fulfill the request anyway
    // and set matchmakingId to undefined so that it won't be stored in the db (potentially overwriting
    // the original request).
    let matchmakingId: MatchmakingIdentifier | undefined

    // Verify that signedUserPhoneNumber was signed by the account's DEK
    if (signedUserPhoneNumber) {
      const dekSigner = await getDataEncryptionKey(account, getContractKit(), logger).catch(() => {
        logger.warn(
          'Failed to retrieve DEK to verify signedUserPhoneNumber. Signature is assumed valid and request wont be recorded.'
        )
      })
      if (dekSigner) {
        if (!verifySignature(userPhoneNumber, signedUserPhoneNumber, dekSigner)) {
          respondWithError(
            response,
            403,
            WarningMessage.INVALID_USER_PHONE_NUMBER_SIGNATURE,
            logger
          )
          return
        }
        matchmakingId = { signedUserPhoneNumber, dekSigner }
      }
    }

    const hasDoneMatchmaking = await getDidMatchmaking(account, logger).catch(() => {
      // If we don't know if the user has performed matchmaking before, we can't ensure the request is valid.
      logger.warn(
        'Failed to determine if user has performed matchmaking. Request will be fulfilled but not recorded.'
      )
      matchmakingId = undefined
      return false
    })

    if (hasDoneMatchmaking) {
      logger.info({ account }, 'Account has performed matchmaking before.')
      if (!signedUserPhoneNumber) {
        // If the account has performed matchmaking before and does not provide their signed phone number in the request,
        // we return an error bc they could be querying matches for a new number that isn't theirs.
        logger.info(
          { account },
          'Blocking account from requerying matches without providing a phone number signature.'
        )
        respondWithError(response, 403, WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE, logger)
        return
      } else if (matchmakingId) {
        // Account has performed matchmaking before and has provided a phone number dek signature which we have verified.
        const signedUserPhoneNumberRecord = await getAccountSignedUserPhoneNumberRecord(
          account,
          logger
        ).catch(() => {
          // Account has performed matchmaking before and has provided a valid phone number dek signature
          // but we were unable to find a record of their previous phone number signature due to a db error.
          logger.info(
            { account },
            'Allowing account to perform matchmaking due to db error finding phone number record. We will not record their phone number this time.'
          )
          matchmakingId = undefined
        })
        if (matchmakingId) {
          if (!signedUserPhoneNumberRecord) {
            // Account has performed matchmaking before and has provided a valid phone number dek signature
            // but we do not have a record of their previous phone number signature in the db.
            // This could be bc we were unable to verify the user phone number signature last time, or bc
            // the user never provided a phone number signature (backwards compatibility).
            logger.info(
              { account },
              'Allowing account to perform matchmaking since we have no record of the phone number it used before. We will record the phone number this time.'
            )
          } else {
            if (signedUserPhoneNumberRecord !== matchmakingId.signedUserPhoneNumber) {
              // Account has performed matchmaking before and has provided a valid phone number dek signature
              // but the phone number signature we have stored in the db does not match what they provided.
              const dekSignerRecord = await getDekSignerRecord(account, logger)
              if (
                dekSignerRecord &&
                matchmakingId.dekSigner !== dekSignerRecord &&
                verifySignature(userPhoneNumber, signedUserPhoneNumberRecord, dekSignerRecord)
              ) {
                // The phone number signature we have stored in the db wont match if the user has rotated their dek.
                logger.info(
                  {
                    account,
                    dekSignerRecord,
                    dekSigner: matchmakingId.dekSigner,
                  },
                  'User has rotated their dek since first requesting matches. Updating dekSigner record for account.'
                )
              } else {
                logger.info(
                  { account },
                  'Blocking account from querying matches for a different phone number than before.'
                )
                respondWithError(
                  response,
                  403,
                  WarningMessage.DUPLICATE_REQUEST_TO_MATCHMAKE,
                  logger
                )
                return
              }
            } else {
              // Account has performed matchmaking before and has provided a phone number dek signature
              // matching what we have stored in the db.
              logger.info(
                { account },
                'Allowing account to requery matches for the same phone number as before.'
              )
            }
          }
        }
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

    await setNumberPairContacts(userPhoneNumber, contactPhoneNumbers, logger)
    await setDidMatchmaking(account, logger, matchmakingId)
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
    hasValidIdentifier(requestBody)
  )
}
