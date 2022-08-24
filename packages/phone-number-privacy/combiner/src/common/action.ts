import { OdisRequest } from '@celo/phone-number-privacy-common'
import { IO } from './io'
import { Session } from './session'

// TODO(2.0.0, refactor) should files like this and Controller go in the common pkg?
export interface Action<R extends OdisRequest> {
  readonly io: IO<R>
  perform(session: Session<R>): Promise<void>
}
