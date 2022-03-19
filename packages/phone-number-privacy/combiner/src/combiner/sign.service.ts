import {
  DomainRestrictedSignatureRequest,
  DomainRestrictedSignatureResponse,
  ErrorMessage,
  ErrorType,
  GetBlindedMessageSigRequest,
  KEY_VERSION_HEADER,
  SignMessageResponse,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { HeaderInit } from 'node-fetch'
import { BLSCryptographyClient } from '../bls/bls-cryptography-client'
import { OdisConfig, VERSION } from '../config'
import { CombinerService, Session } from './combiner.service'

export type SignatureRequest = GetBlindedMessageSigRequest | DomainRestrictedSignatureRequest

export type SignatureResponse = SignMessageResponse | DomainRestrictedSignatureResponse

// TODO(Alec): Don't know if this type handling is correct
export abstract class SignService<
  I extends SignatureRequest,
  O extends SignatureResponse
> extends CombinerService<I, O> {
  protected blsCryptoClient: BLSCryptographyClient
  protected pubKey: string
  protected keyVersion: number
  protected polynomial: string

  public constructor(config: OdisConfig) {
    super(config)
    this.pubKey = config.keys.pubKey
    this.keyVersion = config.keys.version
    this.polynomial = config.keys.polynomial
    // TODO(Alec): add this to session
    this.blsCryptoClient = new BLSCryptographyClient(this.threshold, this.pubKey, this.polynomial)
  }

  protected headers(request: Request<{}, {}, I>): HeaderInit | undefined {
    return {
      ...super.headers(request),
      [KEY_VERSION_HEADER]: this.keyVersion.toString(),
    }
  }

  protected async handleResponseOK(
    data: string,
    status: number,
    url: string,
    session: Session<I, O>
  ): Promise<void> {
    const res = JSON.parse(data)

    const resKeyVersion: number = Number(res.header(KEY_VERSION_HEADER))
    session.logger.info({ resKeyVersion }, 'Signer responded with key version')
    if (resKeyVersion !== this.keyVersion) {
      throw new Error(ErrorMessage.INVALID_KEY_VERSION_RESPONSE)
    }

    const signature = this.parseSignature(res, url, session)
    if (!signature) {
      throw new Error(ErrorMessage.SIGNATURE_MISSING_FROM_SIGNER_RESPONSE)
    }

    session.responses.push({ url, res, status })

    session.logger.info({ signer: url }, 'Add signature')
    const signatureAdditionStart = Date.now()
    this.blsCryptoClient.addSignature({ url, signature })
    session.logger.info(
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
          this.parseBlindedMessage(session.request.body)
        )
        // Close outstanding requests
        session.controller.abort() // 2
      } catch {
        // Already logged, continue to collect signatures
      }
    }
  }

  protected sendSuccessResponse(status: number, signature: string, session: Session<I, O>) {
    // TODO(Alec)
    session.response.status(status).json({
      success: true,
      version: VERSION,
      signature,
    })
  }

  protected abstract logResponseDiscrepancies(session: Session<I, O>): void

  protected async combine(session: Session<I, O>): Promise<void> {
    this.logResponseDiscrepancies(session)

    if (this.blsCryptoClient.hasSufficientSignatures()) {
      // C
      try {
        const combinedSignature = await this.blsCryptoClient.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        return this.sendSuccessResponse(200, combinedSignature, session)
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session) // B
  }

  protected reqKeyHeaderCheck(request: Request<{}, {}, I>): boolean {
    const reqKeyVersion = request.headers[KEY_VERSION_HEADER]
    if (reqKeyVersion && Number(reqKeyVersion) !== this.keyVersion) {
      return false
    }
    return true
  }

  protected abstract parseSignature(
    res: O,
    signerUrl: string,
    session: Session<I, O>
  ): string | undefined

  protected abstract parseBlindedMessage(req: I): string

  private handleMissingSignatures(session: Session<I, O>) {
    let error: ErrorType = ErrorMessage.NOT_ENOUGH_PARTIAL_SIGNATURES
    const majorityErrorCode = session.getMajorityErrorCode()
    if (majorityErrorCode === 403) {
      error = WarningMessage.EXCEEDED_QUOTA
    }
    this.sendFailureResponse(error, majorityErrorCode ?? 500, session)
  }
}
