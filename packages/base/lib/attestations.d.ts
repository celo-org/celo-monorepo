export declare enum IdentifierType {
    PHONE_NUMBER = 0
}
export declare function getIdentifierPrefix(type: IdentifierType): string;
export declare function hashIdentifier(sha3: (a: string) => string | null, identifier: string, type: IdentifierType, salt?: string): string;
export declare function base64ToHex(base64String: string): string;
export declare function sanitizeMessageBase64(base64String: string): string;
export declare function messageContainsAttestationCode(message: string): boolean;
export declare function extractAttestationCodeFromMessage(message: string): string | null;
export interface AttestationsStatus {
    isVerified: boolean;
    numAttestationsRemaining: number;
    total: number;
    completed: number;
}
interface AttestationStat {
    completed: number;
    total: number;
}
/**
 * Returns true if an AttestationStat is considered verified using the given factors,
 * or defaults if factors are ommited.
 * @param stats AttestationStat of the account's attestation identitifer, retrievable via lookupIdentitfiers
 * @param numAttestationsRequired Optional number of attestations required.  Will default to
 *  hardcoded value if absent.
 * @param attestationThreshold Optional threshold for fraction attestations completed. Will
 *  default to hardcoded value if absent.
 */
export declare function isAccountConsideredVerified(stats: AttestationStat | undefined, numAttestationsRequired?: number, attestationThreshold?: number): AttestationsStatus;
export declare const AttestationBase: {
    IdentifierType: typeof IdentifierType;
    getIdentifierPrefix: typeof getIdentifierPrefix;
    hashIdentifier: typeof hashIdentifier;
    base64ToHex: typeof base64ToHex;
    sanitizeMessageBase64: typeof sanitizeMessageBase64;
    messageContainsAttestationCode: typeof messageContainsAttestationCode;
    extractAttestationCodeFromMessage: typeof extractAttestationCodeFromMessage;
    isAccountConsideredVerified: typeof isAccountConsideredVerified;
};
export {};
