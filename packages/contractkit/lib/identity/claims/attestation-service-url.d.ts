import * as t from 'io-ts';
import { Address } from '../../base';
import { ContractKit } from '../../kit';
import { ClaimTypes } from './types';
export declare const AttestationServiceURLClaimType: t.TypeC<{
    type: t.LiteralC<ClaimTypes.ATTESTATION_SERVICE_URL>;
    timestamp: t.NumberC;
    url: t.Type<string, string, unknown>;
}>;
export declare type AttestationServiceURLClaim = t.TypeOf<typeof AttestationServiceURLClaimType>;
export declare const createAttestationServiceURLClaim: (url: string) => {
    type: ClaimTypes.ATTESTATION_SERVICE_URL;
    timestamp: number;
    url: string;
};
export declare function validateAttestationServiceUrl(kit: ContractKit, claim: AttestationServiceURLClaim, address: Address): Promise<string | undefined>;
