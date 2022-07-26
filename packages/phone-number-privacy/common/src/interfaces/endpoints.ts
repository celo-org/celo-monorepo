export enum SignerEndpointPNP {
  LEGACY_PNP_SIGN = '/getBlindedMessagePartialSig',
  LEGACY_PNP_QUOTA = '/getQuota',
  PNP_QUOTA = '/quotaStatus',
  PNP_SIGN = '/sign',
  METRICS = '/metrics',
  STATUS = '/status',
}

export enum CombinerEndpointPNP {
  LEGACY_PNP_SIGN = '/getBlindedMessageSig',
  PNP_SIGN = '/sign',
  MATCHMAKING = '/getContactMatches',
}

export enum DomainEndpoint {
  DOMAIN_SIGN = '/domain/sign',
  DISABLE_DOMAIN = '/domain/disable',
  DOMAIN_QUOTA_STATUS = '/domain/quotaStatus',
}

export type SignerEndpoint = SignerEndpointPNP | DomainEndpoint
export const SignerEndpoint = { ...SignerEndpointPNP, ...DomainEndpoint }

export type CombinerEndpoint = CombinerEndpointPNP | DomainEndpoint
export const CombinerEndpoint = { ...CombinerEndpointPNP, ...DomainEndpoint }

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
    case CombinerEndpoint.PNP_SIGN:
      return SignerEndpoint.PNP_SIGN
    case CombinerEndpoint.LEGACY_PNP_SIGN:
      return SignerEndpoint.LEGACY_PNP_SIGN
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
    case SignerEndpoint.PNP_SIGN:
      return CombinerEndpoint.PNP_SIGN
    case SignerEndpoint.LEGACY_PNP_SIGN:
      return CombinerEndpoint.LEGACY_PNP_SIGN
    default:
      throw new Error(`No corresponding combiner endpoint exists for signer endpoint ${endpoint}`)
  }
}
