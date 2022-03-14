export enum SignerEndpointPNP {
  PARTIAL_SIGN_MESSAGE = '/getBlindedMessagePartialSig',
  GET_QUOTA = '/getQuota',
  METRICS = '/metrics',
  STATUS = '/status',
}

export enum CombinerEndpointPNP {
  SIGN_MESSAGE = '/getBlindedMessageSig',
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
