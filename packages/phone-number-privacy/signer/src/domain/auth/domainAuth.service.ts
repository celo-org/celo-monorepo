import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  Endpoints,
  KnownDomain,
  verifyDisableDomainRequestSignature,
  verifyDomainQuotaStatusRequestSignature,
  verifyDomainRestrictedSignatureRequestSignature,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { DomainState, DOMAINS_STATES_COLUMNS } from '../../database/models/domainState'
import { IDomainAuthService } from './domainAuth.interface'

// TODO(Alec): Does the combiner also need to support all these endpoints?
// TODO(Alec): Should we standardize this pattern accross signer / combiner?
export class DomainAuthService implements IDomainAuthService {
  public authCheck(domainRequest: DomainRequest, endpoint: Endpoints, logger: Logger): boolean {
    try {
      if (endpoint === Endpoints.DISABLE_DOMAIN) {
        return verifyDisableDomainRequestSignature(
          domainRequest as DisableDomainRequest<KnownDomain>
        )
      }
      if (endpoint === Endpoints.DOMAIN_QUOTA_STATUS) {
        return verifyDomainQuotaStatusRequestSignature(
          domainRequest as DomainQuotaStatusRequest<KnownDomain>
        )
      }
      if (endpoint === Endpoints.DOMAIN_SIGN) {
        return verifyDomainRestrictedSignatureRequestSignature(
          domainRequest as DomainRestrictedSignatureRequest<KnownDomain>
        )
      }
      throw new Error(`Endpoint not supported ${endpoint}`)
    } catch (e) {
      logger.error('Error during authentication', e)
      return false
    }
  }

  // TODO(Alec): does this best belong in this file or elsewhere?
  public nonceCheck(
    domainRequest: DomainRequest<KnownDomain>,
    domainState: DomainState,
    logger: Logger
  ): boolean {
    const nonce = domainRequest?.options?.nonce
    const currentNonce = domainState[DOMAINS_STATES_COLUMNS.counter]
    if (currentNonce) {
      return nonce.defined && nonce.value === currentNonce
    } else {
      logger.info('Counter is undefined')
      return true
    }
  }
}
