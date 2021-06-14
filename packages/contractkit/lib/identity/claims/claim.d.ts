import * as t from 'io-ts';
import { ContractKit } from '../../kit';
import { AccountClaim } from './account';
import { AttestationServiceURLClaim } from './attestation-service-url';
import { ClaimTypes } from './types';
export declare const KeybaseClaimType: t.TypeC<{
    type: t.LiteralC<ClaimTypes.KEYBASE>;
    timestamp: t.NumberC;
    username: t.StringC;
}>;
export declare type KeybaseClaim = t.TypeOf<typeof KeybaseClaimType>;
declare const DomainClaimType: t.TypeC<{
    type: t.LiteralC<ClaimTypes.DOMAIN>;
    timestamp: t.NumberC;
    domain: t.StringC;
}>;
declare const NameClaimType: t.TypeC<{
    type: t.LiteralC<ClaimTypes.NAME>;
    timestamp: t.NumberC;
    name: t.StringC;
}>;
export declare const ClaimType: t.UnionC<[t.TypeC<{
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
}>]>;
export declare const SignedClaimType: t.TypeC<{
    claim: t.UnionC<[t.TypeC<{
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
    }>]>;
    signature: t.StringC;
}>;
export declare const DOMAIN_TXT_HEADER = "celo-site-verification";
export declare type DomainClaim = t.TypeOf<typeof DomainClaimType>;
export declare type NameClaim = t.TypeOf<typeof NameClaimType>;
export declare type Claim = AttestationServiceURLClaim | DomainClaim | KeybaseClaim | NameClaim | AccountClaim;
export declare type ClaimPayload<K extends ClaimTypes> = K extends typeof ClaimTypes.DOMAIN ? DomainClaim : K extends typeof ClaimTypes.NAME ? NameClaim : K extends typeof ClaimTypes.KEYBASE ? KeybaseClaim : K extends typeof ClaimTypes.ATTESTATION_SERVICE_URL ? AttestationServiceURLClaim : AccountClaim;
export declare const isOfType: <K extends ClaimTypes>(type: K) => (data: {
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
}) => data is ClaimPayload<K>;
/**
 * Validates a claim made by an account, i.e. whether the claim is usable
 * @param kit The ContractKit object
 * @param claim The claim to validate
 * @param address The address that is making the claim
 * @returns If valid, returns undefined. If invalid or unable to validate, returns a string with the error
 */
export declare function validateClaim(kit: ContractKit, claim: Claim, address: string): Promise<string | undefined>;
export declare function hashOfClaim(claim: Claim): string;
export declare function hashOfClaims(claims: Claim[]): string;
export declare function serializeClaim(claim: Claim): string;
export declare const createNameClaim: (name: string) => {
    type: ClaimTypes.NAME;
    timestamp: number;
    name: string;
};
export declare const createDomainClaim: (domain: string) => {
    type: ClaimTypes.DOMAIN;
    timestamp: number;
    domain: string;
};
export {};
