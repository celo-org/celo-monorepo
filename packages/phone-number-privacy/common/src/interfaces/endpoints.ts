export enum SignerEndpointCommon {
  METRICS = '/metrics',
  STATUS = '/status',
}

export enum SignerEndpointPNP {
  PNP_QUOTA = '/quotaStatus',
  PNP_SIGN = '/sign',
}

export enum CombinerEndpointCommon {
  STATUS = '/status',
}

export enum CombinerEndpointPNP {
  PNP_QUOTA = '/quotaStatus',
  PNP_SIGN = '/sign',
  STATUS = '/status',
}

export enum DomainEndpoint {
  DOMAIN_SIGN = '/domain/sign',
  DISABLE_DOMAIN = '/domain/disable',
  DOMAIN_QUOTA_STATUS = '/domain/quotaStatus',
}

export type SignerEndpoint = SignerEndpointCommon | SignerEndpointPNP | DomainEndpoint
export const SignerEndpoint = { ...SignerEndpointCommon, ...SignerEndpointPNP, ...DomainEndpoint }

export type CombinerEndpoint = CombinerEndpointCommon | CombinerEndpointPNP | DomainEndpoint
export const CombinerEndpoint = {
  ...CombinerEndpointCommon,
  ...CombinerEndpointPNP,
  ...DomainEndpoint,
}

export type Endpoint = SignerEndpoint | CombinerEndpoint
export const Endpoint = { ...SignerEndpoint, ...CombinerEndpoint }

export function getSignerEndpoint(endpoint: CombinerEndpoint): SignerEndpoint {
  switch (endpoint) {
    case CombinerEndpoint.DISABLE_DOMAIN:
      return SignerEndpoint.DISABLE_DOMAIN
    case CombinerEndpoint.DOMAIN_QUOTA_STATUS:
      return SignerEndpoint.DOMAIN_QUOTA_STATUS
    case CombinerEndpoint.DOMAIN_SIGN:
      return SignerEndpoint.DOMAIN_SIGN
    case CombinerEndpoint.PNP_QUOTA:
      return SignerEndpoint.PNP_QUOTA
    case CombinerEndpoint.PNP_SIGN:
      return SignerEndpoint.PNP_SIGN
    default:
      throw new Error(`No corresponding signer endpoint exists for combiner endpoint ${endpoint}`)
  }
}

export function getCombinerEndpoint(endpoint: SignerEndpoint): CombinerEndpoint {
  switch (endpoint) {
    case SignerEndpoint.DISABLE_DOMAIN:
      return CombinerEndpoint.DISABLE_DOMAIN
    case SignerEndpoint.DOMAIN_QUOTA_STATUS:
      return CombinerEndpoint.DOMAIN_QUOTA_STATUS
    case SignerEndpoint.DOMAIN_SIGN:
      return CombinerEndpoint.DOMAIN_SIGN
    case SignerEndpoint.PNP_QUOTA:
      return CombinerEndpoint.PNP_QUOTA
    case SignerEndpoint.PNP_SIGN:
      return CombinerEndpoint.PNP_SIGN
    default:
      throw new Error(`No corresponding combiner endpoint exists for signer endpoint ${endpoint}`)
  }
}
