import {
  DomainRequest,
  OdisRequest,
  PhoneNumberPrivacyRequest,
} from '@celo/phone-number-privacy-common'
import { SignerConfig } from '../config'
import { DomainSession } from '../domain/session'
import { PnpSession } from '../pnp/session'
import { IO } from './io'

export type Session<R extends OdisRequest> = R extends DomainRequest
  ? DomainSession<R>
  : never | R extends PhoneNumberPrivacyRequest
  ? PnpSession<R>
  : never

export interface Action<R extends OdisRequest> {
  readonly config: SignerConfig
  readonly io: IO<R>
  perform(session: Session<R>): Promise<void>
}
