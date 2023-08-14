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

export interface OdisQuotaStatusResult<R extends OdisRequest> {
  sufficient: boolean
  state: OdisQuotaStatus<R>
}

export interface QService {
  /**
   * Return the quota for a given account
   */
  getQuotaStatus(qAccount: string): Promise<OdisQuotaStatus<any>>

  /**
   * Will execute action if enough quota for the account. And if the action is sucessful, it will decrement avaiable quota
   */
  tryQuotaIncrementingAction(quotaAccount: string, action: () => Promise<boolean>): Promise<void>
}
