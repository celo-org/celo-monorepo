import { FederatedAttestations } from '../generated/FederatedAttestations'
import { BaseWrapper } from './BaseWrapper'

export interface FederatedAttestationsConfig {
  // TODO ASv2
}

export class FederatedAttestationsWrapper extends BaseWrapper<FederatedAttestations> {}
