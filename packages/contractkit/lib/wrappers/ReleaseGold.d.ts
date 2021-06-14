import { Signature } from '@celo/utils/lib/signatureUtils';
import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { ReleaseGold } from '../generated/ReleaseGold';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export interface BalanceState {
    totalWithdrawn: string;
    maxDistribution: string;
    totalBalance: string;
    remainingTotalBalance: string;
    remainingUnlockedBalance: string;
    remainingLockedBalance: string;
    currentReleasedTotalAmount: string;
}
export interface ReleaseGoldInfo {
    releaseGoldWrapperAddress: string;
    beneficiary: string;
    releaseOwner: string;
    refundAddress: string;
    liquidityProvisionMet: boolean;
    canValidate: boolean;
    canVote: boolean;
    releaseSchedule: ReleaseSchedule;
    isRevoked: boolean;
    revokedStateData: RevocationInfo;
    balanceStateData: BalanceState;
}
interface ReleaseSchedule {
    releaseStartTime: number;
    releaseCliff: number;
    numReleasePeriods: number;
    releasePeriod: number;
    amountReleasedPerPeriod: BigNumber;
}
interface RevocationInfo {
    revocable: boolean;
    canExpire: boolean;
    releasedBalanceAtRevoke: BigNumber;
    revokeTime: number;
}
/**
 * Contract for handling an instance of a ReleaseGold contract.
 */
export declare class ReleaseGoldWrapper extends BaseWrapper<ReleaseGold> {
    /**
     * Returns the underlying Release schedule of the ReleaseGold contract
     * @return A ReleaseSchedule.
     */
    getReleaseSchedule(): Promise<ReleaseSchedule>;
    /**
     * Returns the beneficiary of the ReleaseGold contract
     * @return The address of the beneficiary.
     */
    getBeneficiary: () => Promise<Address>;
    /**
     * Returns the releaseOwner address of the ReleaseGold contract
     * @return The address of the releaseOwner.
     */
    getReleaseOwner: () => Promise<Address>;
    /**
     * Returns the refund address of the ReleaseGold contract
     * @return The refundAddress.
     */
    getRefundAddress: () => Promise<Address>;
    /**
     * Returns the owner's address of the ReleaseGold contract
     * @return The owner's address.
     */
    getOwner: () => Promise<Address>;
    /**
     * Returns true if the liquidity provision has been met for this contract
     * @return If the liquidity provision is met.
     */
    getLiquidityProvisionMet: () => Promise<boolean>;
    /**
     * Returns true if the contract can validate
     * @return If the contract can validate
     */
    getCanValidate: () => Promise<boolean>;
    /**
     * Returns true if the contract can vote
     * @return If the contract can vote
     */
    getCanVote: () => Promise<boolean>;
    /**
     * Returns the total withdrawn amount from the ReleaseGold contract
     * @return The total withdrawn amount from the ReleaseGold contract
     */
    getTotalWithdrawn: () => Promise<BigNumber>;
    /**
     * Returns the maximum amount of gold (regardless of release schedule)
     * currently allowed for release.
     * @return The max amount of gold currently withdrawable.
     */
    getMaxDistribution: () => Promise<BigNumber>;
    /**
     * Returns the underlying Revocation Info of the ReleaseGold contract
     * @return A RevocationInfo struct.
     */
    getRevocationInfo(): Promise<RevocationInfo>;
    /**
     * Indicates if the release grant is revocable or not
     * @return A boolean indicating revocable releasing (true) or non-revocable(false).
     */
    isRevocable(): Promise<boolean>;
    /**
     * Indicates if the release grant is revoked or not
     * @return A boolean indicating revoked releasing (true) or non-revoked(false).
     */
    isRevoked: () => Promise<boolean>;
    /**
     * Returns the time at which the release schedule was revoked
     * @return The timestamp of the release schedule revocation
     */
    getRevokeTime(): Promise<number>;
    /**
     * Returns the balance of released gold when the grant was revoked
     * @return The balance at revocation time. 0 can also indicate not revoked.
     */
    getReleasedBalanceAtRevoke(): Promise<string>;
    /**
     * Returns the total balance of the ReleaseGold instance
     * @return The total ReleaseGold instance balance
     */
    getTotalBalance: () => Promise<BigNumber>;
    /**
     * Returns the the sum of locked and unlocked gold in the ReleaseGold instance
     * @return The remaining total ReleaseGold instance balance
     */
    getRemainingTotalBalance: () => Promise<BigNumber>;
    /**
     * Returns the remaining unlocked gold balance in the ReleaseGold instance
     * @return The available unlocked ReleaseGold instance gold balance
     */
    getRemainingUnlockedBalance: () => Promise<BigNumber>;
    /**
     * Returns the remaining locked gold balance in the ReleaseGold instance
     * @return The remaining locked ReleaseGold instance gold balance
     */
    getRemainingLockedBalance: () => Promise<BigNumber>;
    /**
     * Returns the total amount that has already released up to now
     * @return The already released gold amount up to the point of call
     */
    getCurrentReleasedTotalAmount: () => Promise<BigNumber>;
    /**
     * Revoke a Release schedule
     * @return A CeloTransactionObject
     */
    revokeReleasing(): Promise<CeloTransactionObject<void>>;
    /**
     * Refund `refundAddress` and `beneficiary` after the ReleaseGold schedule has been revoked.
     * @return A CeloTransactionObject
     */
    refundAndFinalize(): Promise<CeloTransactionObject<void>>;
    /**
     * Locks gold to be used for voting.
     * @param value The amount of gold to lock
     */
    lockGold: (value: BigNumber.Value) => CeloTransactionObject<void>;
    transfer: (to: Address, value: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Unlocks gold that becomes withdrawable after the unlocking period.
     * @param value The amount of gold to unlock
     */
    unlockGold: (value: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Relocks gold in the ReleaseGold instance that has been unlocked but not withdrawn.
     * @param index The index of the pending withdrawal to relock from.
     * @param value The value to relock from the specified pending withdrawal.
     */
    relockGold(value: BigNumber.Value): Promise<Array<CeloTransactionObject<void>>>;
    /**
     * Relocks gold that has been unlocked but not withdrawn.
     * @param index The index of the pending withdrawal to relock from.
     * @param value The value to relock from the specified pending withdrawal.
     */
    _relockGold: (index: number, value: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Withdraw gold in the ReleaseGold instance that has been unlocked but not withdrawn.
     * @param index The index of the pending locked gold withdrawal
     */
    withdrawLockedGold: (index: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Transfer released gold from the ReleaseGold instance back to beneficiary.
     * @param value The requested gold amount
     */
    withdraw: (value: BigNumber.Value) => CeloTransactionObject<void>;
    /**
     * Beneficiary creates an account on behalf of the ReleaseGold contract.
     */
    createAccount: () => CeloTransactionObject<void>;
    /**
     * Beneficiary creates an account on behalf of the ReleaseGold contract.
     * @param name The name to set
     * @param dataEncryptionKey The key to set
     * @param walletAddress The address to set
     */
    setAccount: (name: string, dataEncryptionKey: string | number[], walletAddress: string, v: string | number, r: string | number[], s: string | number[]) => CeloTransactionObject<void>;
    /**
     * Sets the name for the account
     * @param name The name to set
     */
    setAccountName: (name: string) => CeloTransactionObject<void>;
    /**
     * Sets the metadataURL for the account
     * @param metadataURL The url to set
     */
    setAccountMetadataURL: (metadataURL: string) => CeloTransactionObject<void>;
    /**
     * Sets the wallet address for the account
     * @param walletAddress The address to set
     */
    setAccountWalletAddress: (walletAddress: string, v: string | number, r: string | number[], s: string | number[]) => CeloTransactionObject<void>;
    /**
     * Sets the data encryption of the account
     * @param dataEncryptionKey The key to set
     */
    setAccountDataEncryptionKey: (dataEncryptionKey: string | number[]) => CeloTransactionObject<void>;
    /**
     * Sets the contract's liquidity provision to true
     */
    setLiquidityProvision: () => CeloTransactionObject<void>;
    /**
     * Sets the contract's `canExpire` field to `_canExpire`
     * @param _canExpire If the contract can expire `EXPIRATION_TIME` after the release schedule finishes.
     */
    setCanExpire: (_canExpire: boolean) => CeloTransactionObject<void>;
    /**
     * Sets the contract's max distribution
     */
    setMaxDistribution: (distributionRatio: string | number) => CeloTransactionObject<void>;
    /**
     * Sets the contract's beneficiary
     */
    setBeneficiary: (newBeneficiary: string) => CeloTransactionObject<void>;
    /**
     * Authorizes an address to sign votes on behalf of the account.
     * @param signer The address of the vote signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    authorizeVoteSigner(signer: Address, proofOfSigningKeyPossession: Signature): Promise<CeloTransactionObject<void>>;
    /**
     * Authorizes an address to sign validation messages on behalf of the account.
     * @param signer The address of the validator signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    authorizeValidatorSigner(signer: Address, proofOfSigningKeyPossession: Signature): Promise<CeloTransactionObject<void>>;
    /**
     * Authorizes an address to sign consensus messages on behalf of the contract's account. Also switch BLS key at the same time.
     * @param signer The address of the signing key to authorize.
     * @param proofOfSigningKeyPossession The contract's account address signed by the signer address.
     * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass proof
     *   of possession. 48 bytes.
     * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
     *   account address. 96 bytes.
     * @return A CeloTransactionObject
     */
    authorizeValidatorSignerAndBls(signer: Address, proofOfSigningKeyPossession: Signature, blsPublicKey: string, blsPop: string): Promise<CeloTransactionObject<void>>;
    /**
     * Authorizes an address to sign attestation messages on behalf of the account.
     * @param signer The address of the attestation signing key to authorize.
     * @param proofOfSigningKeyPossession The account address signed by the signer address.
     * @return A CeloTransactionObject
     */
    authorizeAttestationSigner(signer: Address, proofOfSigningKeyPossession: Signature): Promise<CeloTransactionObject<void>>;
    /**
     * Revokes pending votes
     * @param account The account to revoke from.
     * @param validatorGroup The group to revoke the vote for.
     * @param value The amount of gold to revoke.
     */
    revokePending(account: Address, group: Address, value: BigNumber): Promise<CeloTransactionObject<void>>;
    /**
     * Revokes active votes
     * @param account The account to revoke from.
     * @param validatorGroup The group to revoke the vote for.
     * @param value The amount of gold to revoke.
     */
    revokeActive(account: Address, group: Address, value: BigNumber): Promise<CeloTransactionObject<void>>;
    revoke(account: Address, group: Address, value: BigNumber): Promise<Array<CeloTransactionObject<void>>>;
}
export {};
