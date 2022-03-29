import {
  authenticateUser,
  CombinerEndpoint,
  getSignerEndpoint,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized, send,
  SignerEndpoint,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseFailure,
  SignMessageResponseSchema,
  SignMessageResponseSuccess,
  WarningMessage
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request, Response } from 'express'
import { VERSION } from '../../config'
import { getContractKit } from '../../web3/contracts'
import { IOAbstract } from '../io.abstract'
import { PnpSignSession } from './sign.session'

export class PnpSignIO extends IOAbstract<SignMessageRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.SIGN_MESSAGE
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

  async init(
    request: Request<{}, {}, unknown>,
    response: Response<SignMessageResponse>
  ): Promise<PnpSignSession | null> {
    const logger = response.locals.logger()
    if (!super.inputChecks(request, response)) {
      return null
    }
    if (!this.getRequestKeyVersion(request, logger)) {
      this.sendFailure(WarningMessage.INVALID_KEY_VERSION_REQUEST, 400, response)
      return null
    }
    if (!(await this.authenticate(request, logger))) {
      this.sendFailure(WarningMessage.UNAUTHENTICATED_USER, 401, response)
      return null
    }
    return new PnpSignSession(request, response, this.config)
  }

  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, SignMessageRequest> {
    return (
      SignMessageRequestSchema.is(request.body) &&
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }

  async authenticate(
    request: Request<{}, {}, SignMessageRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }

  validateSignerResponse(
    data: string,
    url: string,
    session: PnpSignSession
  ): SignMessageResponse {
    const res: unknown = JSON.parse(data)
    if (!SignMessageResponseSchema.is(res)) {
      // TODO(Alec): add error type for this
      const msg = `Signer request to ${url}/${this.signerEndpoint} returned malformed response`
      session.logger.error({ data, signer: url }, msg)
      throw new Error(msg)
    }
    return res
  }

  sendSuccess(
    status: number,
    response: Response<SignMessageResponseSuccess>,
    signature: string,
    performedQueryCount?: number,
    totalQuota?: number,
    blockNumber?: number,
    warnings?: string[]
  ) {
    // response.set(KEY_VERSION_HEADER, key.version.toString())
    send(
      response,
      {
        success: true,
        version: VERSION,
        signature,
        performedQueryCount,
        totalQuota,
        blockNumber,
        warnings, // TODO(Alec)(pnp): update handling of these types in combiner
      },
      status,
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }

  sendFailure(
    error: string,
    status: number,
    response: Response<SignMessageResponseFailure>,
    queryCount?: number,
    totalQuota?: number,
    blockNumber?: number
  ) {
    send(
      response,
      {
        success: false,
        version: VERSION,
        error,
        performedQueryCount: queryCount,
        totalQuota,
        blockNumber,
      },
      status,
      response.locals.logger()
    )
    // Counters.responses.labels(this.endpoint, status.toString()).inc()
  }
}
