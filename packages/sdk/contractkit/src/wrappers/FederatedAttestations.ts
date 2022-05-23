import { FederatedAttestations } from '../generated/FederatedAttestations'
import { BaseWrapper } from './BaseWrapper'

// TODO ASv2 DO NOT MERGE -- add params or delete config if there are none
// & delete other commented-out usages of this Config in CK
// export interface FederatedAttestationsConfig {}

export class FederatedAttestationsWrapper extends BaseWrapper<FederatedAttestations> {}
