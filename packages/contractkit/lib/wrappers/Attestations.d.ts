import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { Attestations } from '../generated/Attestations';
import { BaseWrapper } from './BaseWrapper';
import { Validator } from './Validators';
export interface AttestationStat {
    completed: number;
    total: number;
}
export interface AttestationStateForIssuer {
    attestationState: AttestationState;
}
export interface AttestationsToken {
    address: Address;
    fee: BigNumber;
}
export interface AttestationsConfig {
    attestationExpiryBlocks: number;
    attestationRequestFees: AttestationsToken[];
}
/**
 * Contract for managing identities
 */
export declare enum AttestationState {
    None = 0,
    Incomplete = 1,
    Complete = 2
}
export interface ActionableAttestation {
    issuer: Address;
    blockNumber: number;
    attestationServiceURL: string;
    name: string | undefined;
}
export interface UnselectedRequest {
    blockNumber: number;
    attestationsRequested: number;
    attestationRequestFeeToken: string;
}
export declare type IdentifierLookupResult = Record<string, Record<Address, AttestationStat | undefined> | undefined>;
export declare class AttestationsWrapper extends BaseWrapper<Attestations> {
    /**
     *  Returns the time an attestation can be completable before it is considered expired
     */
    attestationExpiryBlocks: () => Promise<number>;
    /**
     * Returns the attestation request fee in a given currency.
     * @param address Token address.
     * @returns The fee as big number.
     */
    attestationRequestFees: (arg0: string) => Promise<BigNumber>;
    selectIssuersWaitBlocks: () => Promise<number>;
    /**
     * @notice Returns the unselected attestation request for an identifier/account pair, if any.
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    getUnselectedRequest: (identifier: string | number[], account: string) => Promise<{
        blockNumber: number;
        attestationsRequested: number;
        attestationRequestFeeToken: string;
    }>;
    /**
     * @notice Waits for appropriate block numbers for before issuer can be selected
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    waitForSelectingIssuers: (identifier: string, account: string, timeoutSeconds?: number, pollDurationSeconds?: number) => Promise<void>;
    /**
     * Returns the issuers of attestations for a phoneNumber/account combo
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    getAttestationIssuers: (identifier: string | number[], account: string) => Promise<string[]>;
    /**
     * Returns the attestation state of a phone number/account/issuer tuple
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    getAttestationState: (identifier: string, account: Address, issuer: Address) => Promise<AttestationStateForIssuer>;
    /**
     * Returns the attestation stats of a identifer/account pair
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    getAttestationStat: (identifier: string, account: Address) => Promise<AttestationStat>;
    /**
     * Returns the verified status of an identifier/account pair indicating whether the attestation
     * stats for a given pair are completed beyond a certain threshold of confidence (aka "verified")
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     * @param numAttestationsRequired Optional number of attestations required.  Will default to
     *  hardcoded value if absent.
     * @param attestationThreshold Optional threshold for fraction attestations completed. Will
     *  default to hardcoded value if absent.
     */
    getVerifiedStatus(identifier: string, account: Address, numAttestationsRequired?: number, attestationThreshold?: number): Promise<import("@celo/utils/lib/attestations").AttestationsStatus>;
    /**
     * Calculates the amount of StableToken required to request Attestations
     * @param attestationsRequested  The number of attestations to request
     */
    getAttestationFeeRequired(attestationsRequested: number): Promise<BigNumber>;
    /**
     * Approves the necessary amount of StableToken to request Attestations
     * @param attestationsRequested The number of attestations to request
     */
    approveAttestationFee(attestationsRequested: number): Promise<import("./BaseWrapper").CeloTransactionObject<boolean>>;
    /**
     * Returns an array of attestations that can be completed, along with the issuers' attestation
     * service urls
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    getActionableAttestations(identifier: string, account: Address): Promise<ActionableAttestation[]>;
    /**
     * Returns an array of issuer addresses that were found to not run the attestation service
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    getNonCompliantIssuers(identifier: string, account: Address): Promise<Address[]>;
    private isIssuerRunningAttestationService;
    /**
     * Completes an attestation with the corresponding code
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     * @param issuer The issuer of the attestation
     * @param code The code received by the validator
     */
    complete(identifier: string, account: Address, issuer: Address, code: string): Promise<import("./BaseWrapper").CeloTransactionObject<void>>;
    /**
     * Given a list of issuers, finds the matching issuer for a given code
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     * @param code The code received by the validator
     * @param issuers The list of potential issuers
     */
    findMatchingIssuer(identifier: string, account: Address, code: string, issuers: string[]): Promise<string | null>;
    /**
     * Returns the current configuration parameters for the contract.
     * @param tokens List of tokens used for attestation fees.
     */
    getConfig(tokens: string[]): Promise<AttestationsConfig>;
    /**
     * Lookup mapped wallet addresses for a given list of identifiers
     * @param identifiers Attestation identifiers (e.g. phone hashes)
     */
    lookupIdentifiers(identifiers: string[]): Promise<IdentifierLookupResult>;
    /**
     * Requests a new attestation
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param attestationsRequested The number of attestations to request
     */
    request(identifier: string, attestationsRequested: number): Promise<import("./BaseWrapper").CeloTransactionObject<void>>;
    /**
     * Selects the issuers for previously requested attestations for a phone number
     * @param identifier Attestation identifier (e.g. phone hash)
     */
    selectIssuers(identifier: string): import("./BaseWrapper").CeloTransactionObject<void>;
    revealPhoneNumberToIssuer(phoneNumber: string, account: Address, issuer: Address, serviceURL: string, salt?: string, smsRetrieverAppSig?: string): Promise<Response>;
    /**
     * Validates a given code by the issuer on-chain
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account The address of the account which requested attestation
     * @param issuer The address of the issuer of the attestation
     * @param code The code send by the issuer
     */
    validateAttestationCode(identifier: string, account: Address, issuer: Address, code: string): Promise<boolean>;
    /**
     * Gets the relevant attestation service status for a validator
     * @param validator Validator to get the attestation service status for
     */
    getAttestationServiceStatus(validator: Validator): Promise<AttestationServiceStatusResponse>;
}
declare enum AttestationServiceStatusState {
    NoAttestationSigner = "NoAttestationSigner",
    NoMetadataURL = "NoMetadataURL",
    InvalidMetadata = "InvalidMetadata",
    NoAttestationServiceURL = "NoAttestationServiceURL",
    UnreachableAttestationService = "UnreachableAttestationService",
    Valid = "Valid"
}
interface AttestationServiceStatusResponse {
    name: string;
    address: Address;
    ecdsaPublicKey: string;
    blsPublicKey: string;
    affiliation: string | null;
    score: BigNumber;
    hasAttestationSigner: boolean;
    attestationSigner: string;
    attestationServiceURL: string | null;
    metadataURL: string | null;
    okStatus: boolean;
    error: null | Error;
    smsProviders: string[];
    blacklistedRegionCodes: string[];
    rightAccount: boolean;
    signer: string;
    state: AttestationServiceStatusState;
}
export {};
