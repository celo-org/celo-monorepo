import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import {
  authenticateUser,
  CombinerEndpoint,
  ErrorMessage,
  getCombinerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  PnpQuotaRequest,
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
import config, { getVersion } from '../../config'
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

  protected async _handle(session: Session<SignMessageRequest>): Promise<void> {
    let performedQueryCount, totalQuota, blockNumber
    if (await getRequestExists(session.request.body, session.logger)) {
      Counters.duplicateRequests.inc()
      session.logger.debug(
        'Request already exists in db. Will service request without charging quota.'
      )
      session.errors.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
    } else {
      const quotaStatus = await getQuotaStatus(session)
      performedQueryCount = quotaStatus.performedQueryCount
      totalQuota = quotaStatus.totalQuota
      blockNumber = quotaStatus.blockNumber
      // In the case of a blockchain connection failure, totalQuota and blockNumber
      // will be undefined.
      // In the case of a database read failure, performedQueryCount
      // will be undefined.
      if (performedQueryCount && totalQuota) {
        // TODO(Alec): copy domain pattern
        if (!(await this.checkAndUpdateQuotaStatus(performedQueryCount, totalQuota, session))) {
          this.sendFailure(
            WarningMessage.EXCEEDED_QUOTA,
            403,
            session.response,
            session.logger,
            performedQueryCount,
            totalQuota,
            blockNumber
          )
          return
        }
      }
      {
        Counters.requestsFailingOpen.inc()
      }
    }
    // If performedQueryCount or totalQuota are undefined,
    // we fail open and service the request to not block the user.
    // Error messages are stored in the session and included along
    // with the signature in the response.
    const { signature, key } = await this.sign(session)
    this.sendSuccess(
      200,
      session.response,
      session.logger,
      key,
      signature,
      performedQueryCount,
      totalQuota,
      blockNumber,
      session.errors
    )
  }

  protected async checkAndUpdateQuotaStatus(
    performedQueryCount: number,
    totalQuota: number,
    session: Session<SignMessageRequest>
  ): Promise<boolean> {
    if (performedQueryCount >= totalQuota) {
      session.logger.debug({ performedQueryCount, totalQuota }, 'No remaining quota')
      if (bypassQuotaForE2ETesting(session.request.body)) {
        Counters.testQuotaBypassedRequests.inc()
        session.logger.info(
          { request: session.request.body },
          'Request will bypass quota check for e2e testing'
        )
      } else {
        return false
      }
    } else {
      await this.updateQuotaStatus(session)
    }
    return true
  }

  protected async updateQuotaStatus(session: Session<SignMessageRequest>) {
    // TODO(Alec)(Next): use a db transaction here
    const [requestStored, queryCountIncremented] = await Promise.all([
      storeRequest(session.request.body, session.logger),
      incrementQueryCount(session.request.body.account, session.logger),
    ])
    if (!requestStored) {
      session.logger.debug('Did not store request.')
      session.errors.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
    }
    if (!queryCountIncremented) {
      session.logger.debug('Did not increment query count.')
      session.errors.push(ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT)
    }
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
    blockNumber?: number,
    warnings?: string[]
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
        warnings, // TODO(Alec): update handling of these types in combiner
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  protected sendFailure(
    error: string,
    status: number,
    response: Response<SignMessageResponseFailure>,
    logger: Logger,
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

// TODO(Alec): Use dependency injection for this
export async function getQuotaStatus(session: Session<SignMessageRequest | PnpQuotaRequest>) {
  const meter = Histograms.getBlindedSigInstrumentation
    .labels('getQueryCountAndBlockNumber')
    .startTimer()
  const [queryCountResult, blockNumberResult] = await Promise.allSettled([
    // TODO(Alec)
    // Note: The database read of the user's performedQueryCount
    // included here resolves to 0 on error
    getRemainingQueryCount(
      session.logger,
      session.request.body.account,
      session.request.body.hashedPhoneNumber
    ),
    getBlockNumber(),
  ]).finally(meter)

  let performedQueryCount, totalQuota, blockNumber
  let hadBlockchainError = false
  if (queryCountResult.status === 'fulfilled') {
    performedQueryCount = queryCountResult.value.performedQueryCount
    totalQuota = queryCountResult.value.totalQuota
  } else {
    session.logger.error(queryCountResult.reason)
    hadBlockchainError = true
  }
  if (blockNumberResult.status === 'fulfilled') {
    blockNumber = blockNumberResult.value
  } else {
    session.logger.error(blockNumberResult.reason)
    hadBlockchainError = true
  }

  if (hadBlockchainError) {
    session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
  }

  return { performedQueryCount, totalQuota, blockNumber }
}

function bypassQuotaForE2ETesting(requestBody: SignMessageRequest) {
  const sessionID = Number(requestBody.sessionID)
  return sessionID && sessionID % 100 < config.test_quota_bypass_percentage
}
