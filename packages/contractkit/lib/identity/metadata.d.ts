import { Signer } from '@celo/utils/lib/signatureUtils';
import * as t from 'io-ts';
import { ContractKit } from '../kit';
import { Claim, ClaimPayload } from './claims/claim';
import { ClaimTypes } from './claims/types';
export { ClaimTypes } from './claims/types';
export declare const IdentityMetadataType: t.TypeC<{
    claims: t.ArrayC<t.UnionC<[t.TypeC<{
        type: t.LiteralC<ClaimTypes.ATTESTATION_SERVICE_URL>;
        timestamp: t.NumberC;
        url: t.Type<string, string, unknown>;
    }>, t.Type<{
        type: ClaimTypes.ACCOUNT;
        timestamp: number;
        address: string;
        publicKey: string | undefined;
    }, any, unknown>, t.TypeC<{
        type: t.LiteralC<ClaimTypes.DOMAIN>;
        timestamp: t.NumberC;
        domain: t.StringC;
    }>, t.TypeC<{
        type: t.LiteralC<ClaimTypes.KEYBASE>;
        timestamp: t.NumberC;
        username: t.StringC;
    }>, t.TypeC<{
        type: t.LiteralC<ClaimTypes.NAME>;
        timestamp: t.NumberC;
        name: t.StringC;
    }>]>>;
    meta: t.TypeC<{
        address: t.Type<string, string, unknown>;
        signature: t.StringC;
    }>;
}>;
export declare type IdentityMetadata = t.TypeOf<typeof IdentityMetadataType>;
export declare class IdentityMetadataWrapper {
    data: IdentityMetadata;
    static fromEmpty(address: string): IdentityMetadataWrapper;
    static fetchFromURL(kit: ContractKit, url: string): Promise<IdentityMetadataWrapper>;
    static fromFile(kit: ContractKit, path: string): Promise<IdentityMetadataWrapper>;
    static verifySigner(kit: ContractKit, hash: any, signature: any, metadata: any): Promise<boolean>;
    static verifySignerForAddress(kit: ContractKit, hash: any, signature: any, address: string): Promise<boolean>;
    static fromRawString(kit: ContractKit, rawData: string): Promise<IdentityMetadataWrapper>;
    constructor(data: IdentityMetadata);
    get claims(): ({
        type: ClaimTypes.ATTESTATION_SERVICE_URL;
        timestamp: number;
        url: string;
    } | {
        type: ClaimTypes.ACCOUNT;
        timestamp: number;
        address: string;
        publicKey: string | undefined;
    } | {
        type: ClaimTypes.DOMAIN;
        timestamp: number;
        domain: string;
    } | {
        type: ClaimTypes.KEYBASE;
        timestamp: number;
        username: string;
    } | {
        type: ClaimTypes.NAME;
        timestamp: number;
        name: string;
    })[];
    hashOfClaims(): string;
    toString(): string;
    addClaim(claim: Claim, signer: Signer): Promise<{
        type: ClaimTypes.ATTESTATION_SERVICE_URL;
        timestamp: number;
        url: string;
    } | {
        type: ClaimTypes.ACCOUNT;
        timestamp: number;
        address: string;
        publicKey: string | undefined;
    } | {
        type: ClaimTypes.DOMAIN;
        timestamp: number;
        domain: string;
    } | {
        type: ClaimTypes.KEYBASE;
        timestamp: number;
        username: string;
    } | {
        type: ClaimTypes.NAME;
        timestamp: number;
        name: string;
    }>;
    findClaim<K extends ClaimTypes>(type: K): ClaimPayload<K> | undefined;
    filterClaims<K extends ClaimTypes>(type: K): Array<ClaimPayload<K>>;
}
