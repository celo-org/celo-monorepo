import { SignMessageRequest } from '@celo/identity/lib/odis/query'
import {
  authenticateUser,
  CombinerEndpoint,
  ErrorType,
  getCombinerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
  KEY_VERSION_HEADER,
  OdisResponse,
  send,
  SignerEndpoint,
  SignMessageResponseFailure,
  SignMessageResponseSuccess,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { HeaderInit } from 'node-fetch'
import { Counters } from '../../common/metrics'
import { getVersion } from '../../config'
import { getContractKit } from '../../web3/contracts'
import { Session } from '../session'
import { Signer } from '../signer'

export class PnpSign extends Signer<SignMessageRequest> {
  readonly endpoint: SignerEndpoint = SignerEndpoint.PARTIAL_SIGN_MESSAGE
  readonly combinerEndpoint: CombinerEndpoint = getCombinerEndpoint(this.endpoint)

  protected async _handle(
    request: Request<{}, {}, SignMessageRequest>,
    response: Response<OdisResponse<SignMessageRequest>>,
    session: Session<SignMessageRequest>
  ): Promise<void> {
    // TODO(Alec)(Next)
  }

  protected checkRequestKeyVersion(
    request: Request<{}, {}, SignMessageRequest>,
    logger: Logger
  ): boolean {
    let keyVersion = Number(request.headers[KEY_VERSION_HEADER])
    if (Number.isNaN(keyVersion)) {
      logger.warn('Supplied keyVersion in request header is NaN')
      keyVersion = this.config.keystore.keys.domains.latest
    }

    // TODO(Alec)

    return true

    // const key: Key = {
    //   name: DefaultKeyName.DOMAINS,
    //   version: keyVersion,
    // }
  }

  protected validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, SignMessageRequest> {
    return (
      // TODO(Alec): add io-ts schemas for phone number privacy
      hasValidAccountParam(request.body as SignMessageRequest) &&
      hasValidBlindedPhoneNumberParam(request.body as SignMessageRequest) &&
      identifierIsValidIfExists(request.body as SignMessageRequest) &&
      isBodyReasonablySized(request.body as SignMessageRequest)
    )
  }

  protected async authenticate(
    request: Request<{}, {}, SignMessageRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  protected headers(request: Request<{}, {}, SignMessageRequest>): HeaderInit | undefined {
    return {
      ...super.headers(request),
      ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}),
    }
  }

  protected sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    logger: Logger,
    signature: string
  ) {
    send(
      response,
      {
        success: true,
        version: getVersion(),
        signature,
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
