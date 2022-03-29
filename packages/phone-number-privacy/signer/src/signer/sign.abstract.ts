import {
  DomainRestrictedSignatureRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { computeBlindedSignature } from '../bls/bls-cryptography-client'
import { getKeyProvider } from '../key-management/key-provider'
import { Key } from '../key-management/key-provider-base'
import { IAction, Session } from './action.interface'
import { IOAbstract } from './io.abstract'

declare type OdisSignatureRequest = SignMessageRequest | DomainRestrictedSignatureRequest

export abstract class SignAbstract implements IAction<OdisSignatureRequest> {
  abstract readonly io: IOAbstract<OdisSignatureRequest>

  public abstract perform(session: Session<OdisSignatureRequest>): Promise<void>

  protected async sign(
    blindedMessage: string,
    defaultKey: Key,
    session: Session<OdisSignatureRequest>
  ): Promise<{ signature: string; key: Key }> {
    let keyVersion = this.io.getRequestKeyVersion(session.request, session.logger)
    if (!keyVersion) {
      keyVersion = defaultKey.version
    }
    const key: Key = { name: defaultKey.name, version: keyVersion! }
    let privateKey: string
    try {
      privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      session.logger.error({ key }, 'Requested key version not supported')
      throw err
    }
    const signature = computeBlindedSignature(blindedMessage, privateKey, session.logger)
    return { signature, key }
  }
}
