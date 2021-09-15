import Logger from 'bunyan'
import { SequelizeLogger } from '../../db'
import { AttestationKey } from '../../models/attestation'

export interface RerequestAttestationRequest {
  key: AttestationKey
  appSignature: string | undefined
  language: string | undefined
  securityCodePrefix: string
  logger: Logger
  sequelizeLogger: SequelizeLogger
}
