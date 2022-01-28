import Logger from 'bunyan'
import { Request } from 'express'
import { DistributedRequest } from './combiner.interface'

export interface ICombinerInputService {
  validate(request: Request<{}, {}, DistributedRequest>, logger?: Logger): boolean
  authenticate(request: Request<{}, {}, DistributedRequest>, logger?: Logger): Promise<boolean>
}
