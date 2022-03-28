import {
  CombinerEndpoint,
  DomainRequest,
  OdisRequest,
  PhoneNumberPrivacyRequest,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { DomainSession } from './domain/session'
import { PnpSession } from './pnp/session'

export type Session<R extends OdisRequest> = R extends DomainRequest
  ? DomainSession<R>
  : never | R extends PhoneNumberPrivacyRequest
  ? PnpSession<R>
  : never

export interface IActionService<R extends OdisRequest> {
  readonly endpoint: SignerEndpoint
  readonly combinerEndpoint: CombinerEndpoint
  perform(session: Session<R>): Promise<void>
  //  perform(session: Session<R>): Promise<OdisResponse<R>>
}
