import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  KnownDomain,
  SignerEndpoint as Endpoint,
  verifyDisableDomainRequestAuthenticity,
  verifyDomainQuotaStatusRequestAuthenticity,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { DomainState, DOMAINS_STATES_COLUMNS } from '../../database/models/domainState'
import { IDomainAuthService } from './domainAuth.interface'

// TODO(Alec): Does the combiner also need to support all these endpoints?
// TODO(Alec): Should we standardize this pattern accross signer / combiner?
export class DomainAuthService implements IDomainAuthService {
  public authCheck(domainRequest: DomainRequest, endpoint: Endpoint, logger: Logger): boolean {
    try {
      if (endpoint === Endpoint.DISABLE_DOMAIN) {
        return verifyDisableDomainRequestAuthenticity(
          domainRequest as DisableDomainRequest<KnownDomain>
        )
      }
      if (endpoint === Endpoint.DOMAIN_QUOTA_STATUS) {
        return verifyDomainQuotaStatusRequestAuthenticity(
          domainRequest as DomainQuotaStatusRequest<KnownDomain>
        )
      }
      if (endpoint === Endpoint.DOMAIN_SIGN) {
        return verifyDomainRestrictedSignatureRequestAuthenticity(
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
