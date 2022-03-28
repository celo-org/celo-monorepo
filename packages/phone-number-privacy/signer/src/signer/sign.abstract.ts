import {
  DomainRestrictedSignatureRequest,
  KEY_VERSION_HEADER,
  SignMessageRequest,
  WarningMessage,
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
      keyVersion = defaultKey.version
    }
    const key: Key = { name: defaultKey.name, version: keyVersion! }
    let privateKey: string
    try {
      privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      if (key.version !== defaultKey.version) {
        // @victor Is this the correct behavior?
        // If the requested keyVersion is not supported, attempt signing with the default keyVersion
        key.version = defaultKey.version
        privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
      } else {
        throw err
      }
    }
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
      logger.warn({ keyVersionHeader }, WarningMessage.INVALID_KEY_VERSION_REQUEST)
      return undefined
    }
    return requestedKeyVersion
  }
}
