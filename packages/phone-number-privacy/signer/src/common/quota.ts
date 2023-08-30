import {
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  OdisRequest,
  PnpQuotaRequest,
  PnpQuotaStatus,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { DomainStateRecord } from './database/models/domain-state'

// prettier-ignore
export type OdisQuotaStatus<R extends OdisRequest> = R extends
  | DomainQuotaStatusRequest | DomainRestrictedSignatureRequest ? DomainStateRecord : never
  | R extends SignMessageRequest | PnpQuotaRequest ? PnpQuotaStatus: never

// TODO this is only used in Domain endpoints now
export interface OdisQuotaStatusResult<R extends OdisRequest> {
  sufficient: boolean
  state: OdisQuotaStatus<R>
}
