import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  KEY_VERSION_HEADER,
  SignerEndpoint,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { getKeyProvider } from '../key-management/key-provider'
import { Key } from '../key-management/key-provider-base'
import { IActionService, Session } from './action.interface'

declare type OdisSignatureRequest = SignMessageRequest | DomainRestrictedSignatureRequest

export abstract class SignAction<R extends OdisSignatureRequest> implements IActionService<R> {
  abstract readonly endpoint: SignerEndpoint
  abstract readonly combinerEndpoint: CombinerEndpoint

  public abstract perform(session: Session<R>): Promise<void>

  protected async sign(
    blindedMessage: string,
    defaultKey: Key,
    session: Session<R>
  ): Promise<{ signature: string; key: Key }> {
    let keyVersion = this.getRequestKeyVersion(session.request, session.logger)
    if (keyVersion ?? false) {
      // TODO(Alec): Should we throw here?
      keyVersion = defaultKey.version
    }
    const key: Key = { name: defaultKey.name, version: keyVersion! }
    const privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    const signature = computeBlindedSignature(blindedMessage, privateKey, session.logger)
    return { signature, key }
  }

  protected getRequestKeyVersion(
    request: Request<{}, {}, OdisSignatureRequest>,
    logger: Logger
  ): number | undefined {
    const keyVersionHeader = request.headers[KEY_VERSION_HEADER]
    logger.info({ keyVersionHeader })
    const requestedKeyVersion = Number(keyVersionHeader)
    if (Number.isNaN(requestedKeyVersion)) {
      // TODO(Alec): New error type + review error whether we should throw at any point
      logger.warn({ keyVersionHeader }, 'Supplied keyVersion in request header is NaN')
      return undefined
    }
    // TODO(Alec)(Next): should we check against the supported key versions?
    return requestedKeyVersion
  }
}
