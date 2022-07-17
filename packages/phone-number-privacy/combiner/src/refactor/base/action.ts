import { OdisRequest } from '@celo/phone-number-privacy-common'
import { Session } from '../session'
import { IO } from './io'

// TODO: Can this go into common pkg?

export interface Action<R extends OdisRequest> {
  readonly io: IO<R>
  perform(session: Session<R>): Promise<void>
}
