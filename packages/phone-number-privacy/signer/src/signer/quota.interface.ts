import {
  DomainQuotaStatusRequest,
  DomainRestrictedSignatureRequest,
  OdisRequest,
  PnpQuotaRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { Transaction } from 'knex'
import { DomainStateRecord } from '../database/models/domainState'
import { Session } from './action.interface'
import { PnpQuotaStatus } from './pnp/quota.service'

export type OdisQuotaStatus<R extends OdisRequest> = R extends
  | DomainQuotaStatusRequest
  | DomainRestrictedSignatureRequest
  ? DomainStateRecord
  : never | R extends SignMessageRequest | PnpQuotaRequest
  ? PnpQuotaStatus
  : never

export interface OdisQuotaStatusResult<R extends OdisRequest> {
  sufficient: boolean
  state: OdisQuotaStatus<R>
}

export interface IQuotaService<R extends OdisRequest> {
  checkAndUpdateQuotaStatus(
    state: OdisQuotaStatus<R>,
    session: Session<R>,
    trx: Transaction<OdisQuotaStatus<R>>
  ): Promise<OdisQuotaStatusResult<R>>

  getQuotaStatus(
    session: Session<R>,
    trx?: Transaction<OdisQuotaStatus<R>>
  ): Promise<OdisQuotaStatus<R>>
}
