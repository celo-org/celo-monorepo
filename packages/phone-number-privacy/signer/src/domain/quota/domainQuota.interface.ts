import { Domain } from '@celo/phone-number-privacy-common/lib/domains'
import Logger from 'bunyan'
import { Transaction } from 'knex'
import { DomainStateRecord } from '../../database/models/domainState'

export interface IDomainQuotaService {
  checkAndUpdateQuota: (
    domain: Domain,
    domainState: DomainStateRecord,
    trx: Transaction<DomainStateRecord>,
    logger: Logger
  ) => Promise<{ sufficient: boolean; newState: DomainStateRecord }>
}
