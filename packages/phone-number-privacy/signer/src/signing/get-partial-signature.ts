import {
  authenticateUser,
  ErrorMessage,
  ErrorType,
  GetBlindedMessageSigRequest,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  respondWithError,
  SignerEndpoint as Endpoint,
  SignMessageResponse,
  SignMessageResponseFailure,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import allSettled from 'promise.allsettled'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { Counters, Histograms } from '../common/metrics'
import config, { getVersion } from '../config'
import { incrementQueryCount } from '../database/wrappers/account'
import { getRequestExists, storeRequest } from '../database/wrappers/request'
import { getKeyProvider } from '../key-management/key-provider'
import { DefaultKeyName, Key, KeyProvider } from '../key-management/key-provider-base'
import { getBlockNumber, getContractKit } from '../web3/contracts'
import { getRemainingQueryCount } from './query-quota'

allSettled.shim()

export type GetBlindedMessagePartialSigRequest = GetBlindedMessageSigRequest

// TODO(Alec): De-dupe
function sendFailureResponse(
  response: Response,
  error: ErrorType,
  status: number,
  endpoint: Endpoint,
  logger: Logger,
  performedQueryCount?: number,
  totalQuota?: number,
  blockNumber?: number
) {
  Counters.responses.labels(endpoint, status.toString()).inc()
  respondWithError(
    response,
    {
      success: false,
      error,
      version: getVersion(),
    },
    status,
    logger
  )
}

export async function handleGetBlindedMessagePartialSig(
  request: Request<{}, {}, GetBlindedMessagePartialSigRequest>,
  response: Response
) {
  const endpoint = Endpoint.PARTIAL_SIGN_MESSAGE
  Counters.requests.labels(endpoint).inc()

  const logger: Logger = response.locals.logger
  logger.info({ request: request.body }, 'Request received')
  logger.debug('Begin handleGetBlindedMessagePartialSig')

  let keyVersion = Number(request.headers[KEY_VERSION_HEADER])
  if (Number.isNaN(keyVersion)) {
    logger.warn('Supplied keyVersion in request header is NaN')
    keyVersion = config.keystore.keys.phoneNumberPrivacy.latest
  }

  const key: Key = {
    name: DefaultKeyName.PHONE_NUMBER_PRIVACY,
    version: keyVersion,
  }

  try {
    if (!isValidGetSignatureInput(request.body)) {
      sendFailureResponse(response, WarningMessage.INVALID_INPUT, 400, endpoint, logger)
      return
    }

    const meterAuthenticateUser = Histograms.getBlindedSigInstrumentation
      .labels('authenticateUser')
      .startTimer()
    if (
      !(await authenticateUser(request, getContractKit(), logger).finally(meterAuthenticateUser))
    ) {
      sendFailureResponse(response, WarningMessage.UNAUTHENTICATED_USER, 401, endpoint, logger)
      return
    }

    const { account, blindedQueryPhoneNumber, hashedPhoneNumber } = request.body

    const errorMsgs: string[] = []
    // In the case of a blockchain connection failure, don't block user
    // but set the error status accordingly
    //
    const meterGetQueryCountAndBlockNumber = Histograms.getBlindedSigInstrumentation
      .labels('getQueryCountAndBlockNumber')
      .startTimer()
    const [_queryCount, _blockNumber] = await Promise.allSettled([
      // Note: The database read of the user's performedQueryCount
      // included here resolves to 0 on error
      getRemainingQueryCount(logger, account, hashedPhoneNumber),
      getBlockNumber(),
    ]).finally(meterGetQueryCountAndBlockNumber)

    let totalQuota = -1
    let performedQueryCount = -1
    let blockNumber = -1
    let hadBlockchainError = false
    if (_queryCount.status === 'fulfilled') {
      performedQueryCount = _queryCount.value.performedQueryCount
      totalQuota = _queryCount.value.totalQuota
    } else {
      logger.error(_queryCount.reason)
      hadBlockchainError = true
    }
    if (_blockNumber.status === 'fulfilled') {
      blockNumber = _blockNumber.value
    } else {
      logger.error(_blockNumber.reason)
      hadBlockchainError = true
    }

    if (hadBlockchainError) {
      errorMsgs.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    if (_queryCount.status === 'fulfilled' && performedQueryCount >= totalQuota) {
      logger.debug('No remaining query count')
      if (bypassQuotaForTesting(request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        logger.info({ request: request.body }, 'Request will bypass quota check for testing')
      } else {
        sendFailureResponse(
          response,
          WarningMessage.EXCEEDED_QUOTA,
          403,
          endpoint,
          logger,
          performedQueryCount,
          totalQuota,
          blockNumber // TODO(Alec)
        )
        return
      }
    }

    const meterGenerateSignature = Histograms.getBlindedSigInstrumentation
      .labels('generateSignature')
      .startTimer()
    let signature: string
    try {
      const keyProvider: KeyProvider = getKeyProvider()
      const privateKey: string = await keyProvider.getPrivateKeyOrFetchFromStore(key)
      signature = computeBlindedSignature(blindedQueryPhoneNumber, privateKey, logger)
    } catch (err) {
      meterGenerateSignature()
      throw err
    }
    meterGenerateSignature()

    if (await getRequestExists(request.body, logger)) {
      Counters.duplicateRequests.inc()
      logger.debug(
        'Signature request already exists in db. Will not store request or increment query count.'
      )
      errorMsgs.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
    } else {
      const meterDbWriteOps = Histograms.getBlindedSigInstrumentation
        .labels('dbWriteOps')
        .startTimer()
      const [requestStored, queryCountIncremented] = await Promise.all([
        storeRequest(request.body, logger),
        incrementQueryCount(account, logger),
      ]).finally(meterDbWriteOps)
      if (!requestStored) {
        logger.debug('Did not store request.')
        errorMsgs.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
      }
      if (!queryCountIncremented) {
        logger.debug('Did not increment query count.')
        errorMsgs.push(ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT)
      } else {
        performedQueryCount++
      }
    }

    let signMessageResponse: SignMessageResponse
    const signMessageResponseSuccess: SignMessageResponse = {
      success: !errorMsgs.length,
      signature,
      version: getVersion(),
      performedQueryCount,
      totalQuota,
      blockNumber,
    }
    if (errorMsgs.length) {
      const signMessageResponseFailure = signMessageResponseSuccess as SignMessageResponseFailure
      signMessageResponseFailure.error = errorMsgs.join(', ')
      signMessageResponse = signMessageResponseFailure
    } else {
      signMessageResponse = signMessageResponseSuccess
    }
    Counters.responses.labels(endpoint, '200').inc()
    logger.info({ response: signMessageResponse }, 'Signature retrieval success')
    response.set(KEY_VERSION_HEADER, key.version.toString()).json(signMessageResponse)
  } catch (err) {
    logger.error('Failed to get signature')
    logger.error(err)
    sendFailureResponse(response, ErrorMessage.UNKNOWN_ERROR, 500, endpoint, logger)
  }
}

function isValidGetSignatureInput(requestBody: GetBlindedMessagePartialSigRequest): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidBlindedPhoneNumberParam(requestBody) &&
    identifierIsValidIfExists(requestBody) &&
    isBodyReasonablySized(requestBody)
  )
}

function bypassQuotaForTesting(requestBody: GetBlindedMessagePartialSigRequest) {
  const sessionID = Number(requestBody.sessionID)
  return sessionID && sessionID % 100 < config.test_quota_bypass_percentage
}
