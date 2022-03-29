import { OdisRequest } from '@celo/phone-number-privacy-common'
import { IOAbstract } from './io.abstract'
import { Session } from './session'

export interface IAction<R extends OdisRequest> {
  readonly io: IOAbstract<R>
  perform(session: Session<R>): Promise<void>
}
