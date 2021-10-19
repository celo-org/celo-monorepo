import { Domain } from '@celo/identity/lib/odis/domains'
import { Transaction } from 'knex'
import { DomainState } from '../../database/models/domainState'

export interface IDomainQuotaService {
  doesHaveRemainingQuota: (domain: Domain, domainState: DomainState) => Promise<boolean>
  increaseQuotaCount: (
    domain: Domain,
    domainState: DomainState,
    trx: Transaction<DomainState>
  ) => Promise<boolean>
}
