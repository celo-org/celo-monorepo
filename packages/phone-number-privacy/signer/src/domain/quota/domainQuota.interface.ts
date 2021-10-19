import { KnownDomain } from '@celo/identity/lib/odis/domains'
import { Transaction } from 'knex'
import { DomainState } from '../../database/models/domainState'

export interface IDomainQuotaService {
  doesHaveRemainingQuota: (domain: KnownDomain, domainState: DomainState) => Promise<boolean>
  increaseQuotaCount: (
    domain: KnownDomain,
    domainState: DomainState,
    trx: Transaction<DomainState>
  ) => Promise<boolean>
}
