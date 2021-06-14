import { Signature } from '@celo/utils/lib/signatureUtils';
import { Address } from '../base';
import { Accounts } from '../generated/Accounts';
import { BaseWrapper, CeloTransactionObject } from '../wrappers/BaseWrapper';
interface AccountSummary {
    address: string;
    name: string;
    authorizedSigners: {
        vote: Address;
        validator: Address;
        attestation: Address;
    };
    metadataURL: string;
    wallet: Address;
    dataEncryptionKey: string;
}
/**
 * Contract for handling deposits needed for voting.
 */
export declare class AccountsWrapper extends BaseWrapper<Accounts> {
    /**
     * Creates an account.
     */
    createAccount: () => CeloTransactionObject<boolean>;
    /**
     * Returns the attestation signer for the specified account.
     * @param account The address of the account.
     * @return The address with which the account can vote.
     */
    getAttestationSigner: (account: string) => Promise<Address>;
    /**
     * Returns if the account has authorized an attestation signer
     * @param account The address of the account.
     * @return If the account has authorized an attestation signer
     */
    hasAuthorizedAttestationSigner: (account: string) => Promise<boolean>;
    /**
     * Returns the vote signer for the specified account.
     * @param account The address of the account.
     * @return The address with which the account can vote.
     */
    getVoteSigner: (account: string) => Promise<Address>;
    /**
     * Returns the validator signer for the specified account.
     * @param account The address of the account.
     * @return The address with which the account can register a validator or group.
     */
    getValidatorSigner: (account: string) => Promise<Address>;
    /**
     * Returns the account address given the signer for voting
     * @param signer Address that is authorized to sign the tx as voter
     * @return The Account address
     */
    voteSignerToAccount: (signer: Address) => Promise<Address>;
    /**
     * Returns the account address given the signer for validating
     * @param signer Address that is authorized to sign the tx as validator
     * @return The Account address
     */
    validatorSignerToAccount: (signer: Address) => Promise<Address>;
    /**
     * Returns the account associated with `signer`.
     * @param signer The address of the account or previously authorized signer.
     * @dev Fails if the `signer` is not an account or previously authorized signer.
     * @return The associated account.
     */
    signerToAccount: (signer: Address) => Promise<Address>;
    /**
     * Check if an account already exists.
     * @param account The address of the account
     * @return Returns `true` if account exists. Returns `false` otherwise.
     */
    isAccount: (account: string) => Promise<boolean>;
    /**
     * Check if an address is a signer address
     * @param address The address of the account
     * @return Returns `true` if account exists. Returns `false` otherwise.
     */
    isSigner: (address: string) => Promise<boolean>;
    getCurrentSigners(address: string): Promise<string[]>;
    getAccountSummary(account: string): Promise<AccountSummary>;
    /**
     * Authorize an attestation signing key on behalf of this account to another address.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    authorizeAttestationSigner(signer: Address, proofOfSigningKeyPossession: Signature): Promise<CeloTransactionObject<void>>;
    /**
     * Authorizes an address to sign votes on behalf of the account.
     * @param signer The address of the vote signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    authorizeVoteSigner(signer: Address, proofOfSigningKeyPossession: Signature): Promise<CeloTransactionObject<void>>;
    /**
     * Authorizes an address to sign consensus messages on behalf of the account.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    authorizeValidatorSigner(signer: Address, proofOfSigningKeyPossession: Signature): Promise<CeloTransactionObject<void>>;
    /**
     * Authorizes an address to sign consensus messages on behalf of the account. Also switch BLS key at the same time.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
     *   of possession. 48 bytes.
     * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
     *   account address. 96 bytes.
     * @return A CeloTransactionObject
     */
    authorizeValidatorSignerAndBls(signer: Address, proofOfSigningKeyPossession: Signature, blsPublicKey: string, blsPop: string): Promise<CeloTransactionObject<void>>;
    generateProofOfKeyPossession(account: Address, signer: Address): Promise<{
        v: number;
        r: string;
        s: string;
    }>;
    generateProofOfKeyPossessionLocally(account: Address, signer: Address, privateKey: string): Promise<{
        v: number;
        r: string;
        s: string;
    }>;
    /**
     * Returns the set name for the account
     * @param account Account
     * @param blockNumber Height of result, defaults to tip.
     */
    getName(account: Address, blockNumber?: number): Promise<string>;
    /**
     * Returns the set data encryption key for the account
     * @param account Account
     */
    getDataEncryptionKey: (account: string) => Promise<string>;
    /**
     * Returns the set wallet address for the account
     * @param account Account
     */
    getWalletAddress: (account: string) => Promise<string>;
    /**
     * Returns the metadataURL for the account
     * @param account Account
     */
    getMetadataURL: (account: string) => Promise<string>;
    /**
     * Sets the data encryption of the account
     * @param encryptionKey The key to set
     */
    setAccountDataEncryptionKey: (dataEncryptionKey: string | number[]) => CeloTransactionObject<void>;
    /**
     * Convenience Setter for the dataEncryptionKey and wallet address for an account
     * @param name A string to set as the name of the account
     * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
     * @param walletAddress The wallet address to set for the account
     * @param proofOfPossession Signature from the wallet address key over the sender's address
     */
    setAccount(name: string, dataEncryptionKey: string, walletAddress: Address, proofOfPossession?: Signature | null): CeloTransactionObject<void>;
    /**
     * Sets the name for the account
     * @param name The name to set
     */
    setName: (name: string) => CeloTransactionObject<void>;
    /**
     * Sets the metadataURL for the account
     * @param url The url to set
     */
    setMetadataURL: (metadataURL: string) => CeloTransactionObject<void>;
    /**
     * Sets the wallet address for the account
     * @param address The address to set
     */
    setWalletAddress(walletAddress: Address, proofOfPossession?: Signature | null): CeloTransactionObject<void>;
    parseSignatureOfAddress(address: Address, signer: string, signature: string): {
        v: number;
        r: string;
        s: string;
    };
    private getParsedSignatureOfAddress;
}
export {};
