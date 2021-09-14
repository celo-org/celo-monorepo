import { AttestationKey } from '../../models/attestation'
import { E164Number } from '@celo/utils/lib/io'
import Logger from 'bunyan'

import { SequelizeLogger } from '../../db'

export interface SendSmsRequest {
  key: AttestationKey
  phoneNumber: E164Number
  messageToSend: string
  securityCode: string | null
  attestationCode: string | null
  appSignature: string | undefined
  language: string | undefined
  logger: Logger
  sequelizeLogger: SequelizeLogger
  onlyUseProvider: string | null
}
