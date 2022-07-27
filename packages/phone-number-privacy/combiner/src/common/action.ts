import { OdisRequest } from '@celo/phone-number-privacy-common'
import { IO } from './io'
import { Session } from './session'

// TODO: Can this go into common pkg?

export interface Action<R extends OdisRequest> {
  readonly io: IO<R>
  perform(session: Session<R>): Promise<void>
}
