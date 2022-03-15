import {
  DisableDomainRequest,
  Domain,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  SignerEndpoint as Endpoint,
  verifyDisableDomainRequestAuthenticity,
  verifyDomainQuotaStatusRequestAuthenticity,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { DomainState, DOMAINS_STATES_COLUMNS } from '../../database/models/domainState'
import { IDomainAuthService } from './domainAuth.interface'

// TODO(Alec): Should we standardize this pattern across signer / combiner?
export class DomainAuthService implements IDomainAuthService {
  public authCheck(domainRequest: DomainRequest, endpoint: Endpoint, logger: Logger): boolean {
    try {
      if (endpoint === Endpoint.DISABLE_DOMAIN) {
        return verifyDisableDomainRequestAuthenticity(domainRequest as DisableDomainRequest<Domain>)
      }
      if (endpoint === Endpoint.DOMAIN_QUOTA_STATUS) {
        return verifyDomainQuotaStatusRequestAuthenticity(
          domainRequest as DomainQuotaStatusRequest<Domain>
        )
      }
      if (endpoint === Endpoint.DOMAIN_SIGN) {
        return verifyDomainRestrictedSignatureRequestAuthenticity(
          domainRequest as DomainRestrictedSignatureRequest<Domain>
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
    domainRequest: DomainRequest<Domain>,
    domainState: DomainState,
    logger: Logger
  ): boolean {
    const nonce = domainRequest?.options?.nonce
    if (!nonce) {
      logger.info('Nonce is undefined')
      return false
    }
    let currentNonce = domainState[DOMAINS_STATES_COLUMNS.counter]
    if (!currentNonce) {
      logger.info('Counter is undefined')
      currentNonce = 0
    }
    return nonce.value >= currentNonce
  }
}
