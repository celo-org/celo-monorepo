import {
  DisableDomainRequest,
  DomainQuotaStatusRequest,
  DomainRequest,
  DomainRestrictedSignatureRequest,
  isKnownDomain,
  KnownDomain,
  verifyDisableDomainRequestAuthenticity,
  verifyDomainQuotaStatusRequestAuthenticity,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { ICombinerInputService } from '../input.interface'

// tslint:disable: max-classes-per-file

export abstract class DomainInputService implements ICombinerInputService {
  validate(request: Request<{}, {}, DomainRequest>): boolean {
    return isKnownDomain(request.body.domain)
  }
  abstract authenticate(
    request: Request<{}, {}, DomainRestrictedSignatureRequest<KnownDomain>>
  ): Promise<boolean>
}

export class DomainSignInputService extends DomainInputService {
  authenticate(
    request: Request<{}, {}, DomainRestrictedSignatureRequest<KnownDomain>>
  ): Promise<boolean> {
    return Promise.resolve(verifyDomainRestrictedSignatureRequestAuthenticity(request.body))
  }
}

export class DomainQuotaStatusInputService extends DomainInputService {
  authenticate(request: Request<{}, {}, DomainQuotaStatusRequest<KnownDomain>>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }
}

export class DomainDisableInputService extends DomainInputService {
  authenticate(request: Request<{}, {}, DisableDomainRequest<KnownDomain>>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }
}
