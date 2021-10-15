import { Domain } from '@celo/identity/lib/odis/domains'

export interface IDomainQuotaService {
  doesHaveRemainingQuota: (domain: Domain) => Promise<boolean>
  increaseQuotaCount: (domain: Domain) => Promise<boolean>
}
