import {
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  DomainRestrictedSignatureResponseSuccess,
  ErrorMessage,
  ErrorType,
  GetBlindedMessageSigRequest,
  KEY_VERSION_HEADER,
  SignMessageResponse,
  SignMessageResponseSuccess,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import AbortController from 'abort-controller'
import { Request, Response } from 'express'
import { HeaderInit } from 'node-fetch'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { OdisConfig, VERSION } from '../config'
import { CombinerService } from './combiner.service'

export type SignatureResponse = SignMessageResponse | DomainRestrictedSignatureResponse

export type SignatureRequest = DomainRestrictedSignatureRequest | GetBlindedMessageSigRequest

export abstract class SignService extends CombinerService {
  protected blsCryptoClient: BLSCryptographyClient
  protected pubKey: string
  protected keyVersion: number
  protected polynomial: string

  public constructor(config: OdisConfig) {
    super(config)
    this.pubKey = config.keys.pubKey
    this.keyVersion = config.keys.version
    this.polynomial = config.keys.polynomial
    this.blsCryptoClient = new BLSCryptographyClient(this.threshold, this.pubKey, this.polynomial)
  }

  protected async inputCheck(
    request: Request<{}, {}, unknown>,
    response: Response
  ): Promise<boolean> {
    return (
      (await super.inputCheck(request, response)) &&
      this.reqKeyHeaderCheck(request as Request<{}, {}, SignatureRequest>, response)
    )
  }

  protected headers(request: Request<{}, {}, GetBlindedMessageSigRequest>): HeaderInit | undefined {
    return {
      ...super.headers(request),
      [KEY_VERSION_HEADER]: this.keyVersion.toString(),
    }
  }

  protected async handleResponseOK(
    request: Request<{}, {}, SignatureRequest>,
    data: string,
    status: number,
    url: string,
    controller: AbortController
  ): Promise<void> {
    const res = JSON.parse(data)

    const resKeyVersion: number = Number(res.header(KEY_VERSION_HEADER))
    this.logger.info({ resKeyVersion }, 'Signer responded with key version')
    if (resKeyVersion !== this.keyVersion) {
      throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    }

    const signature = this.parseSignature(res, url)
    if (!signature) {
      throw new Error(ErrorMessage.SIGNATURE_MISSING_FROM_SIGNER_RESPONSE)
    }

    this.responses.push({ url, res, status })

    this.logger.info({ signer: url }, 'Add signature')
    const signatureAdditionStart = Date.now()
    this.blsCryptoClient.addSignature({ url, signature })
    this.logger.info(
      {
        signer: url,
        hasSufficientSignatures: this.blsCryptoClient.hasSufficientSignatures(),
        additionLatency: Date.now() - signatureAdditionStart,
      },
      'Added signature'
    )
    // Send response immediately once we cross threshold
    // BLS threshold signatures can be combined without all partial signatures
    if (this.blsCryptoClient.hasSufficientSignatures()) {
      try {
        await this.blsCryptoClient.combinePartialBlindedSignatures(
          this.parseBlindedMessage(request.body)
        )
        // Close outstanding requests
        controller.abort()
      } catch {
        // Already logged, continue to collect signatures
      }
    }
  }

  protected sendSuccessResponse(
    response: Response<DomainRestrictedSignatureResponseSuccess | SignMessageResponseSuccess>,
    signature: string,
    status: number
  ) {
    response.status(status).json({
      success: true,
      version: VERSION,
      signature,
    })
  }

  protected async combineSignerResponses(
    request: Request<{}, {}, SignatureRequest>,
    response: Response
  ): Promise<void> {
    this.logResponseDiscrepancies()

    if (this.blsCryptoClient.hasSufficientSignatures()) {
      try {
        const combinedSignature = await this.blsCryptoClient.combinePartialBlindedSignatures(
          this.parseBlindedMessage(request.body),
          this.logger
        )
        return this.sendSuccessResponse(response, combinedSignature, 200)
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(this.getMajorityErrorCode(), response)
  }

  protected abstract logResponseDiscrepancies(): void

  protected abstract parseSignature(res: SignatureResponse, signerUrl: string): string | undefined

  protected abstract parseBlindedMessage(req: SignatureRequest): string

  private reqKeyHeaderCheck(
    request: Request<{}, {}, SignatureRequest>,
    response: Response
  ): boolean {
    const reqKeyVersion = request.headers[KEY_VERSION_HEADER]
    if (reqKeyVersion && Number(reqKeyVersion) !== this.keyVersion) {
      this.sendFailureResponse(response, WarningMessage.INVALID_KEY_VERSION_REQUEST, 400)
      return false
    }
    return true
  }

  private handleMissingSignatures(majorityErrorCode: number | null, response: Response) {
    let error: ErrorType = ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    if (majorityErrorCode === 403) {
      error = WarningMessage.EXCEEDED_QUOTA
    }
    this.sendFailureResponse(response, error, majorityErrorCode ?? 500)
  }
}
