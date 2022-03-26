import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import {
  authenticateUser,
  CombinerEndpoint,
  ErrorMessage,
  ErrorType,
  getCombinerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  send,
  SignerEndpoint,
  SignMessageRequestSchema,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { computeBlindedSignature } from '../../bls/bls-cryptography-client'
import { Counters, Histograms } from '../../common/metrics'
import { getVersion } from '../../config'
import { incrementQueryCount } from '../../database/wrappers/account'
import { getRequestExists, storeRequest } from '../../database/wrappers/request'
import { getKeyProvider } from '../../key-management/key-provider'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { getRemainingQueryCount } from '../../signing/query-quota'
import { getBlockNumber, getContractKit } from '../../web3/contracts'
import { Controller } from '../controller'
import { Session } from '../session'

export class PnpSign extends Controller<SignMessageRequest> {
  readonly endpoint: SignerEndpoint = SignerEndpoint.PARTIAL_SIGN_MESSAGE
  readonly combinerEndpoint: CombinerEndpoint = getCombinerEndpoint(this.endpoint)

  // TODO(Alec): de-dupe
  protected async sign(
    session: Session<SignMessageRequest>
  ): Promise<{ signature: string; key: Key }> {
    const blindedMessage = session.request.body.blindedQueryPhoneNumber
    let keyVersion = Number(session.request.headers[KEY_VERSION_HEADER])
    if (Number.isNaN(keyVersion)) {
      // TODO(Alec): Should we throw here?
      session.logger.warn('Supplied keyVersion in request header is NaN')
      keyVersion = this.config.keystore.keys.phoneNumberPrivacy.latest
    }
    const key: Key = { name: DefaultKeyName.PHONE_NUMBER_PRIVACY, version: keyVersion }
    const privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    const signature = computeBlindedSignature(blindedMessage, privateKey, session.logger)
    return { signature, key }
  }

  // TODO(Alec)(Next)
  protected async _handle(session: Session<SignMessageRequest>): Promise<void> {
    const errorMsgs: string[] = [] // TODO(Alec): add this to session

    // In the case of a blockchain connection failure, don't block user
    // but set the error status accordingly
    const meterGetQueryCountAndBlockNumber = Histograms.getBlindedSigInstrumentation
      .labels('getQueryCountAndBlockNumber')
      .startTimer()
    const [queryCountResult, blockNumberResult] = await Promise.allSettled([
      // Note: The database read of the user's performedQueryCount
      // included here resolves to 0 on error
      getRemainingQueryCount(
        session.logger,
        session.request.body.account,
        session.request.body.hashedPhoneNumber
      ),
      getBlockNumber(),
    ]).finally(meterGetQueryCountAndBlockNumber)

    const { performedQueryCount, totalQuota } =
      queryCountResult.status === 'fulfilled'
        ? queryCountResult.value
        : { performedQueryCount: undefined, totalQuota: undefined }
    const blockNumber =
      blockNumberResult.status === 'fulfilled' ? blockNumberResult.value : undefined

    // let hadBlockchainError = false
    // if (queryCountResult.status === 'fulfilled') {
    //   performedQueryCount = queryCountResult.value.performedQueryCount
    //   totalQuota = queryCountResult.value.totalQuota
    // } else {
    //   session.logger.error(_queryCount.reason)
    //   hadBlockchainError = true
    // }
    // if (_blockNumber.status === 'fulfilled') {
    //   blockNumber = _blockNumber.value
    // } else {
    //   session.logger.error(_blockNumber.reason)
    //   hadBlockchainError = true
    // }

    // if (hadBlockchainError) {
    //   errorMsgs.push(ErrorMessage.CONTRACT_GET_FAILURE)
    // }

    if (performedQueryCount && totalQuota && performedQueryCount >= totalQuota) {
      session.logger.debug('No remaining query count')
      if (bypassQuotaForTesting(session.request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        session.logger.info(
          { request: session.request.body },
          'Request will bypass quota check for testing'
        )
      } else {
        return this.sendFailure(
          WarningMessage.EXCEEDED_QUOTA,
          403,
          session.response,
          session.logger,
          performedQueryCount,
          totalQuota,
          blockNumber
        )
      }
    }

    // TODO(Alec): This check should happen before and bypass the quota check
    if (await getRequestExists(session.request.body, session.logger)) {
      Counters.duplicateRequests.inc()
      session.logger.debug(
        'Signature request already exists in db. Will not store request or increment query count.'
      )
      errorMsgs.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
    } else {
      const [requestStored, queryCountIncremented] = await Promise.all([
        storeRequest(session.request.body, session.logger),
        incrementQueryCount(session.request.body.account, session.logger),
      ])
      if (!requestStored) {
        session.logger.debug('Did not store request.')
        errorMsgs.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
      }
      if (!queryCountIncremented) {
        session.logger.debug('Did not increment query count.')
        errorMsgs.push(ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT)
      } else {
        // performedQueryCount++
      }
    }

    const { signature, key } = await this.sign(session)

    this.sendSuccess(
      200,
      session.response,
      session.logger,
      key,
      signature,
      performedQueryCount,
      totalQuota,
      blockNumber
    )

    // let signMessageResponse: SignMessageResponse
    // const signMessageResponseSuccess: SignMessageResponse = {
    //   success: !errorMsgs.length,
    //   signature,
    //   version: getVersion(),
    //   performedQueryCount,
    //   totalQuota,
    //   blockNumber,
    // }
    // if (errorMsgs.length) {
    //   const signMessageResponseFailure = signMessageResponseSuccess as SignMessageResponseFailure
    //   signMessageResponseFailure.error = errorMsgs.join(', ')
    //   signMessageResponse = signMessageResponseFailure
    // } else {
    //   signMessageResponse = signMessageResponseSuccess
    // }

    // } catch (err) {
    //   logger.error('Failed to get signature')
    //   logger.error(err)
    //   sendFailureResponse(response, ErrorMessage.UNKNOWN_ERROR, 500, endpoint, logger)
    // }
  }

  // TODO(Alec): de-dupe
  protected checkRequestKeyVersion(
    request: Request<{}, {}, SignMessageRequest>,
    logger: Logger
  ): boolean {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    logger.info({ keyVersionHeader })
    const requestedKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(requestedKeyVersion)) {
      logger.warn({ keyVersionHeader }, 'Requested key version is NaN')
      return false
    }
    // TODO(Alec)(Next): should we check against the supported key versions?
    return true
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, SignMessageRequest> {
    return (
      SignMessageRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  protected async authenticate(
    request: Request<{}, {}, SignMessageRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  // protected headers(request: Request<{}, {}, SignMessageRequest>): HeaderInit | undefined {
  //   return {
  //     ...super.headers(request),
  //     ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
  //   }
  // }

  protected sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    logger: Logger,
    key: Key,
    signature: string,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected sendFailure(
    error: ErrorType,
    status: number,
    response: Response<SignMessageResponseFailure>,
    logger: Logger,
    signature?: string,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        signature,
        performedQueryCount,
        totalQuota,
        blockNumber,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
