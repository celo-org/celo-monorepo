export enum CombinerEndpoint {
  STATUS = '/status',
  GET_BLINDED_MESSAGE_SIG = '/getBlindedMessageSig',
  MATCHMAKING = '/getContactMatches',

  DOMAIN_SIGN = '/domainSign',
  DISABLE_DOMAIN = '/domainDisable',
  DOMAIN_QUOTA_STATUS = '/domainQuotaStatus',
}

export enum SignerEndpoint {
  STATUS = '/status',
  METRICS = '/metrics',
  GET_BLINDED_MESSAGE_PARTIAL_SIG = '/getBlindedMessagePartialSig',
  GET_QUOTA = '/getQuota',

  DOMAIN_SIGN = '/domain/sign',
  DISABLE_DOMAIN = '/domain/disable',
  DOMAIN_QUOTA_STATUS = '/domain/quotaStatus',
}
