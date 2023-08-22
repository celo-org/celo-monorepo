import { OdisRequest, OdisResponse } from '@celo/phone-number-privacy-common'
import { Locals, Request, Response } from 'express'
import { IO } from './io'
import { Session } from './session'

export interface Action<R extends OdisRequest> {
  readonly io: IO<R>
  perform(
    request: Request<{}, {}, R>,
    response: Response<OdisResponse<R>, Locals>,
    session: Session<R>
  ): Promise<void>
}
