import {
  DomainRestrictedSignatureRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'

// prettier-ignore
export type OdisSignatureRequest =
  | SignMessageRequest
  | DomainRestrictedSignatureRequest
