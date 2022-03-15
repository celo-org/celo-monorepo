import {
  DisableDomainRequest,
  disableDomainRequestSchema,
  Domain,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestSchema,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainSchema,
  verifyDisableDomainRequestAuthenticity,
  verifyDomainQuotaStatusRequestAuthenticity,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '@celo/phone-number-privacy-common'
import { Request } from 'express'
import { IInputService } from '../input.interface'

// tslint:disable: max-classes-per-file

export class DomainSignInputService implements IInputService {
  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
    return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
  }
  authenticate(
    request: Request<{}, {}, DomainRestrictedSignatureRequest<Domain>>
  ): Promise<boolean> {
    return Promise.resolve(verifyDomainRestrictedSignatureRequestAuthenticity(request.body))
  }
}

export class DomainQuotaStatusInputService implements IInputService {
  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, DomainQuotaStatusRequest> {
    return domainQuotaStatusRequestSchema(DomainSchema).is(request.body)
  }
  authenticate(request: Request<{}, {}, DomainQuotaStatusRequest<Domain>>): Promise<boolean> {
    return Promise.resolve(verifyDomainQuotaStatusRequestAuthenticity(request.body))
  }
}

export class DomainDisableInputService implements IInputService {
  validate(request: Request<{}, {}, unknown>): request is Request<{}, {}, DisableDomainRequest> {
    return disableDomainRequestSchema(DomainSchema).is(request.body)
  }
  authenticate(request: Request<{}, {}, DisableDomainRequest<Domain>>): Promise<boolean> {
    return Promise.resolve(verifyDisableDomainRequestAuthenticity(request.body))
  }
}
