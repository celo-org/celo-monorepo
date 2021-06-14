import { CeloContract } from './base';
import { newAccounts } from './generated/Accounts';
import { newAttestations } from './generated/Attestations';
import { newBlockchainParameters } from './generated/BlockchainParameters';
import { newDoubleSigningSlasher } from './generated/DoubleSigningSlasher';
import { newDowntimeSlasher } from './generated/DowntimeSlasher';
import { newElection } from './generated/Election';
import { newEpochRewards } from './generated/EpochRewards';
import { newEscrow } from './generated/Escrow';
import { newExchange } from './generated/Exchange';
import { newFeeCurrencyWhitelist } from './generated/FeeCurrencyWhitelist';
import { newFreezer } from './generated/Freezer';
import { newGasPriceMinimum } from './generated/GasPriceMinimum';
import { newGoldToken } from './generated/GoldToken';
import { newGovernance } from './generated/Governance';
import { newLockedGold } from './generated/LockedGold';
import { newMultiSig } from './generated/MultiSig';
import { newRandom } from './generated/Random';
import { newRegistry } from './generated/Registry';
import { newReserve } from './generated/Reserve';
import { newSortedOracles } from './generated/SortedOracles';
import { newStableToken } from './generated/StableToken';
import { newTransferWhitelist } from './generated/TransferWhitelist';
import { newValidators } from './generated/Validators';
import { ContractKit } from './kit';
export declare const ContractFactories: {
    Accounts: typeof newAccounts;
    Attestations: typeof newAttestations;
    BlockchainParameters: typeof newBlockchainParameters;
    DoubleSigningSlasher: typeof newDoubleSigningSlasher;
    DowntimeSlasher: typeof newDowntimeSlasher;
    Election: typeof newElection;
    EpochRewards: typeof newEpochRewards;
    Escrow: typeof newEscrow;
    Exchange: typeof newExchange;
    FeeCurrencyWhitelist: typeof newFeeCurrencyWhitelist;
    Freezer: typeof newFreezer;
    GasPriceMinimum: typeof newGasPriceMinimum;
    GoldToken: typeof newGoldToken;
    Governance: typeof newGovernance;
    LockedGold: typeof newLockedGold;
    MultiSig: typeof newMultiSig;
    Random: typeof newRandom;
    Registry: typeof newRegistry;
    Reserve: typeof newReserve;
    SortedOracles: typeof newSortedOracles;
    StableToken: typeof newStableToken;
    TransferWhitelist: typeof newTransferWhitelist;
    Validators: typeof newValidators;
};
export declare type CFType = typeof ContractFactories;
declare type ContractCacheMap = {
    [K in keyof CFType]?: ReturnType<CFType[K]>;
};
/**
 * Native Web3 contracts factory and cache.
 *
 * Exposes accessors to all `CeloContract` web3 contracts.
 *
 * Mostly a private cache, kit users would normally use
 * a contract wrapper
 */
export declare class Web3ContractCache {
    readonly kit: ContractKit;
    private cacheMap;
    constructor(kit: ContractKit);
    getAccounts(): Promise<import("./generated/Accounts").Accounts>;
    getAttestations(): Promise<import("./generated/Attestations").Attestations>;
    getBlockchainParameters(): Promise<import("./generated/BlockchainParameters").BlockchainParameters>;
    getDoubleSigningSlasher(): Promise<import("./generated/DoubleSigningSlasher").DoubleSigningSlasher>;
    getDowntimeSlasher(): Promise<import("./generated/DowntimeSlasher").DowntimeSlasher>;
    getElection(): Promise<import("./generated/Election").Election>;
    getEpochRewards(): Promise<import("./generated/EpochRewards").EpochRewards>;
    getEscrow(): Promise<import("./generated/Escrow").Escrow>;
    getExchange(): Promise<import("./generated/Exchange").Exchange>;
    getFeeCurrencyWhitelist(): Promise<import("./generated/FeeCurrencyWhitelist").FeeCurrencyWhitelist>;
    getFreezer(): Promise<import("./generated/Freezer").Freezer>;
    getGasPriceMinimum(): Promise<import("./generated/GasPriceMinimum").GasPriceMinimum>;
    getGoldToken(): Promise<import("./generated/GoldToken").GoldToken>;
    getGovernance(): Promise<import("./generated/Governance").Governance>;
    getLockedGold(): Promise<import("./generated/LockedGold").LockedGold>;
    getMultiSig(address: string): Promise<import("./generated/MultiSig").MultiSig>;
    getRandom(): Promise<import("./generated/Random").Random>;
    getRegistry(): Promise<import("./generated/Registry").Registry>;
    getReserve(): Promise<import("./generated/Reserve").Reserve>;
    getSortedOracles(): Promise<import("./generated/SortedOracles").SortedOracles>;
    getStableToken(): Promise<import("./generated/StableToken").StableToken>;
    getTransferWhitelist(): Promise<import("./generated/TransferWhitelist").TransferWhitelist>;
    getValidators(): Promise<import("./generated/Validators").Validators>;
    /**
     * Get native web3 contract wrapper
     */
    getContract<C extends keyof typeof ContractFactories>(contract: C, address?: string): Promise<NonNullable<ContractCacheMap[C]>>;
}
export {};
