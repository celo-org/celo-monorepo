import {
  DomainRestrictedSignatureRequest,
  KEY_VERSION_HEADER,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request } from 'express'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { getKeyProvider } from '../key-management/key-provider'
import { Key } from '../key-management/key-provider-base'
import { IAction, Session } from './action.interface'
import { IOAbstract } from './io.abstract'

declare type OdisSignatureRequest = SignMessageRequest | DomainRestrictedSignatureRequest

export abstract class SignAbstract<R extends OdisSignatureRequest> implements IAction<R> {
  abstract readonly io: IOAbstract<R>

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
