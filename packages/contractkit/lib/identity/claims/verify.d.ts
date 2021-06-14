/// <reference types="node" />
import { ContractKit } from '../..';
import { Claim } from './claim';
import { ClaimTypes } from './types';
/**
 * Verifies a claim made by an account, i.e. whether a claim can be verified to be correct
 * @param kit ContractKit object
 * @param claim The claim to verify
 * @param address The address that is making the claim
 * @returns If valid, returns undefined. If invalid or unable to verify, returns a string with the error
 */
export declare function verifyClaim(kit: ContractKit, claim: Claim, address: string): Promise<string | undefined>;
export declare const verifyAccountClaim: (kit: ContractKit, claim: {
    type: ClaimTypes.ACCOUNT;
    timestamp: number;
    address: string;
    publicKey: string | undefined;
}, address: string) => Promise<string | undefined>;
declare type dnsResolverFunction = (hostname: string, callback: (err: NodeJS.ErrnoException, addresses: string[][]) => void) => void;
/**
 * It verifies if a DNS domain includes in the TXT records an entry with name
 * `celo-site-verification` and a valid signature in base64
 */
export declare const verifyDomainRecord: (kit: ContractKit, claim: {
    type: ClaimTypes.DOMAIN;
    timestamp: number;
    domain: string;
}, address: string, dnsResolver?: dnsResolverFunction) => Promise<string | undefined>;
export {};
