import {
  DomainRequest,
  OdisRequest,
  PhoneNumberPrivacyRequest,
} from '@celo/phone-number-privacy-common'
import { Config } from '../config'
import { DomainSession } from './domain/session'
import { IOAbstract } from './io.abstract'
import { PnpSession } from './pnp/session'

export type Session<R extends OdisRequest> = R extends DomainRequest
  ? DomainSession<R>
  : never | R extends PhoneNumberPrivacyRequest
  ? PnpSession<R>
  : never

export interface IAction<R extends OdisRequest> {
  readonly config: Config
  readonly io: IOAbstract<R>
  perform(session: Session<R>): Promise<void>
}
