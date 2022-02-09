import { CombinerEndpoint, SignerEndpoint } from '..'

export function getSignerEndpoint(endpoint: CombinerEndpoint): SignerEndpoint {
  switch (endpoint) {
    case CombinerEndpoint.DISABLE_DOMAIN:
      return SignerEndpoint.DISABLE_DOMAIN
    case CombinerEndpoint.DOMAIN_QUOTA_STATUS:
      return SignerEndpoint.DOMAIN_QUOTA_STATUS
    case CombinerEndpoint.DOMAIN_SIGN:
      return SignerEndpoint.DOMAIN_SIGN
    case CombinerEndpoint.GET_BLINDED_MESSAGE_SIG:
      return SignerEndpoint.GET_BLINDED_MESSAGE_PARTIAL_SIG
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
    case SignerEndpoint.GET_BLINDED_MESSAGE_PARTIAL_SIG:
      return CombinerEndpoint.GET_BLINDED_MESSAGE_SIG
    default:
      throw new Error(`No corresponding combiner endpoint exists for signer endpoint ${endpoint}`)
  }
}
