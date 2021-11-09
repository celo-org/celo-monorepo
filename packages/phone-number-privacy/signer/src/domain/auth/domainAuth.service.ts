import { KnownDomain } from '@celo/identity/lib/odis/domains'
import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  verifyDisableDomainRequestSignature,
  verifyDomainQuotaStatusRequestSignature,
  verifyDomainRestrictedSignatureRequestSignature,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Endpoints } from '../../server'
import { IDomainAuthService } from './domainAuth.interface'

export class DomainAuthService implements IDomainAuthService {
  public authCheck(domainRequest: DomainRequest, endpoint: Endpoints, logger: Logger): boolean {
    try {
      if (endpoint === Endpoints.DISABLE_DOMAIN) {
        return verifyDisableDomainRequestSignature(
          domainRequest as DisableDomainRequest<KnownDomain>
        )
      } else if (endpoint === Endpoints.DOMAIN_QUOTA_STATUS) {
        return verifyDomainQuotaStatusRequestSignature(
          domainRequest as DomainQuotaStatusRequest<KnownDomain>
        )
      } else if (endpoint === Endpoints.DOMAIN_SIGN) {
        return verifyDomainRestrictedSignatureRequestSignature(
          domainRequest as DomainRestrictedSignatureRequest<KnownDomain>
        )
      } else {
        throw new Error('Endpoint not supported')
      }
    } catch (e) {
      logger.error('Error during authentication', e)
      return false
    }
  }
}
