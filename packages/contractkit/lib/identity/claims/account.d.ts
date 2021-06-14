import * as t from 'io-ts';
import { ClaimTypes } from './types';
export declare const AccountClaimTypeH: t.TypeC<{
    type: t.LiteralC<ClaimTypes.ACCOUNT>;
    timestamp: t.NumberC;
    address: t.Type<string, string, unknown>;
    publicKey: t.UnionC<[t.UndefinedC, t.Type<string, string, unknown>]>;
}>;
export declare const AccountClaimType: t.Type<{
    type: ClaimTypes.ACCOUNT;
    timestamp: number;
    address: string;
    publicKey: string | undefined;
}, any, unknown>;
export declare type AccountClaim = t.TypeOf<typeof AccountClaimTypeH>;
export declare const createAccountClaim: (address: string, publicKey?: string | undefined) => {
    type: ClaimTypes.ACCOUNT;
    timestamp: number;
    address: string;
    publicKey: string | undefined;
};
