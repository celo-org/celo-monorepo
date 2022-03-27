import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import {
  authenticateUser,
  CombinerEndpoint,
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
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getDatabase } from '../../database/database'
import { getRequestExists } from '../../database/wrappers/request'
import { getKeyProvider } from '../../key-management/key-provider'
import { DefaultKeyName, Key } from '../../key-management/key-provider-base'
import { getContractKit } from '../../web3/contracts'
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
    await getDatabase().transaction(async (trx) => {
      let queryCount, totalQuota, blockNumber
      if (await getRequestExists(session.request.body, session.logger, trx)) {
        Counters.duplicateRequests.inc()
        session.logger.debug(
          'Request already exists in db. Will service request without charging quota.'
        )
        session.errors.push(WarningMessage.DUPLICATE_REQUEST_TO_GET_PARTIAL_SIG)
      } else {
        const quotaStatus = await this.quotaService.getQuotaStatus(session, trx) // TODO(Alec)
        queryCount = quotaStatus.queryCount
        totalQuota = quotaStatus.totalQuota
        blockNumber = quotaStatus.blockNumber
        // In the case of a blockchain connection failure, totalQuota and/or blockNumber
        // may be undefined.
        // In the case of a database connection failure, queryCount
        // may be undefined.
        if (quotaStatus.queryCount && quotaStatus.totalQuota) {
          const { sufficient, state } = await this.quotaService.checkAndUpdateQuotaStatus(
            quotaStatus,
            session,
            trx
          )
          if (!sufficient) {
            this.sendFailure(
              WarningMessage.EXCEEDED_QUOTA,
              403,
              session.response,
              session.logger,
              queryCount,
              totalQuota,
              blockNumber
            )
            return
          }
          queryCount = state.queryCount
        } else {
          Counters.requestsFailingOpen.inc()
        }
      }
      // If queryCount or totalQuota are undefined,
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
        queryCount,
        totalQuota,
        blockNumber,
        session.errors
      )
    })
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
    queryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: getVersion(),
        error,
        performedQueryCount: queryCount,
        totalQuota,
        blockNumber,
      },
      status,
      logger
    )
    Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
