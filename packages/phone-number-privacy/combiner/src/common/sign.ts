import {
  DomainRestrictedSignatureRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import { DomainThresholdStateService } from '../domain/services/threshold-state'
import { PnpThresholdStateService } from '../pnp/services/threshold-state'

// prettier-ignore
export type OdisSignatureRequest =
  | SignMessageRequest
  | DomainRestrictedSignatureRequest

export type ThresholdStateService<R extends OdisSignatureRequest> = R extends SignMessageRequest
  ? PnpThresholdStateService<R>
  : never | R extends DomainRestrictedSignatureRequest
  ? DomainThresholdStateService<R>
  : never
