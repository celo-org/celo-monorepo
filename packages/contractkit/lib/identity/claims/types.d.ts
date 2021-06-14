import * as t from 'io-ts';
export declare const SignatureType: t.StringC;
export declare const TimestampType: t.NumberC;
export declare const now: () => number;
export declare enum ClaimTypes {
    ATTESTATION_SERVICE_URL = "ATTESTATION_SERVICE_URL",
    ACCOUNT = "ACCOUNT",
    DOMAIN = "DOMAIN",
    KEYBASE = "KEYBASE",
    NAME = "NAME",
    PROFILE_PICTURE = "PROFILE_PICTURE",
    TWITTER = "TWITTER"
}
export declare const VERIFIABLE_CLAIM_TYPES: ClaimTypes[];
export declare const VALIDATABLE_CLAIM_TYPES: ClaimTypes[];
export declare const SINGULAR_CLAIM_TYPES: ClaimTypes[];
