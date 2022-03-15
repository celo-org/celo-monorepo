import Logger from 'bunyan'
import { Request } from 'express'
import { DistributedRequest } from './combiner.interface'

export interface IInputService {
  validate(
    request: Request<{}, {}, unknown>,
    logger: Logger
  ): request is Request<{}, {}, DistributedRequest>
  authenticate(request: Request<{}, {}, DistributedRequest>, logger: Logger): Promise<boolean>
}
