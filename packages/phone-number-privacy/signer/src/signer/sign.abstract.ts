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

export abstract class SignAbstract<R extends OdisSignatureRequest> implements IAction<R> {
  abstract readonly io: IOAbstract<R>

  public abstract perform(session: Session<R>): Promise<void>

  protected async sign(blindedMessage: string, key: Key, session: Session<R>): Promise<string> {
    let privateKey: string
    try {
      privateKey = await getKeyProvider().getPrivateKeyOrFetchFromStore(key)
    } catch (err) {
      session.logger.error({ key }, 'Requested key version not supported')
      throw err
    }
    return computeBlindedSignature(blindedMessage, privateKey, session.logger)
  }
}
