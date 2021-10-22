import { KnownDomain } from '@celo/identity/lib/odis/domains'
import { Transaction } from 'knex'
import { DomainState } from '../../database/models/domainState'

export interface IDomainQuotaService {
  checkAndUpdateQuota: (
    domain: KnownDomain,
    domainState: DomainState,
    trx: Transaction<DomainState>
  ) => Promise<{ sufficient: boolean; newState: DomainState }>
}
