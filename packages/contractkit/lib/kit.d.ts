import { BigNumber } from 'bignumber.js';
import Web3 from 'web3';
import { Tx } from 'web3-core';
import { TransactionObject } from 'web3-eth';
import { AddressRegistry } from './address-registry';
import { Address, CeloToken } from './base';
import { WrapperCache } from './contract-cache';
import { TransactionResult } from './utils/tx-result';
import { Wallet } from './wallets/wallet';
import { Web3ContractCache } from './web3-contract-cache';
import { AttestationsConfig } from './wrappers/Attestations';
import { DowntimeSlasherConfig } from './wrappers/DowntimeSlasher';
import { ElectionConfig } from './wrappers/Election';
import { ExchangeConfig } from './wrappers/Exchange';
import { GasPriceMinimumConfig } from './wrappers/GasPriceMinimum';
import { GovernanceConfig } from './wrappers/Governance';
import { LockedGoldConfig } from './wrappers/LockedGold';
import { ReserveConfig } from './wrappers/Reserve';
import { SortedOraclesConfig } from './wrappers/SortedOracles';
import { StableTokenConfig } from './wrappers/StableTokenWrapper';
import { ValidatorsConfig } from './wrappers/Validators';
/**
 * Creates a new instance of `ContractKit` give a nodeUrl
 * @param url CeloBlockchain node url
 * @optional wallet to reuse or add a wallet different that the default (example ledger-wallet)
 */
export declare function newKit(url: string, wallet?: Wallet): ContractKit;
/**
 * Creates a new instance of `ContractKit` give a web3 instance
 * @param web3 Web3 instance
 * @optional wallet to reuse or add a wallet different that the default (example ledger-wallet)
 */
export declare function newKitFromWeb3(web3: Web3, wallet?: Wallet): ContractKit;
export interface NetworkConfig {
    election: ElectionConfig;
    exchange: ExchangeConfig;
    attestations: AttestationsConfig;
    governance: GovernanceConfig;
    lockedGold: LockedGoldConfig;
    sortedOracles: SortedOraclesConfig;
    gasPriceMinimum: GasPriceMinimumConfig;
    reserve: ReserveConfig;
    stableToken: StableTokenConfig;
    validators: ValidatorsConfig;
    downtimeSlasher: DowntimeSlasherConfig;
}
export interface KitOptions {
    gasInflationFactor: number;
    gasPrice: string;
    feeCurrency?: Address;
    from?: Address;
}
interface AccountBalance {
    gold: BigNumber;
    usd: BigNumber;
    total: BigNumber;
    lockedGold: BigNumber;
    pending: BigNumber;
}
export declare class ContractKit {
    readonly web3: Web3;
    /** core contract's address registry */
    readonly registry: AddressRegistry;
    /** factory for core contract's native web3 wrappers  */
    readonly _web3Contracts: Web3ContractCache;
    /** factory for core contract's kit wrappers  */
    readonly contracts: WrapperCache;
    private config;
    constructor(web3: Web3, wallet?: Wallet);
    getTotalBalance(address: string): Promise<AccountBalance>;
    getNetworkConfig(): Promise<NetworkConfig>;
    /**
     * Set CeloToken to use to pay for gas fees
     * @param token cUSD (StableToken) or cGLD (GoldToken)
     */
    setFeeCurrency(token: CeloToken): Promise<void>;
    addAccount(privateKey: string): void;
    /**
     * Set default account for generated transactions (eg. tx.from )
     */
    set defaultAccount(address: Address | undefined);
    /**
     * Default account for generated transactions (eg. tx.from)
     */
    get defaultAccount(): Address | undefined;
    set gasInflationFactor(factor: number);
    get gasInflationFactor(): number;
    set gasPrice(price: number);
    get gasPrice(): number;
    /**
     * Set the ERC20 address for the token to use to pay for transaction fees.
     * The ERC20 must be whitelisted for gas.
     *
     * Set to `null` to use cGLD
     *
     * @param address ERC20 address
     */
    set defaultFeeCurrency(address: Address | undefined);
    get defaultFeeCurrency(): Address | undefined;
    isListening(): Promise<boolean>;
    isSyncing(): Promise<boolean>;
    /**
     * Send a transaction to celo-blockchain.
     *
     * Similar to `web3.eth.sendTransaction()` but with following differences:
     *  - applies kit tx's defaults
     *  - estimatesGas before sending
     *  - returns a `TransactionResult` instead of `PromiEvent`
     */
    sendTransaction(tx: Tx): Promise<TransactionResult>;
    sendTransactionObject(txObj: TransactionObject<any>, tx?: Omit<Tx, 'data'>): Promise<TransactionResult>;
    private fillTxDefaults;
    getFirstBlockNumberForEpoch(epochNumber: number): Promise<number>;
    getLastBlockNumberForEpoch(epochNumber: number): Promise<number>;
    getEpochNumberOfBlock(blockNumber: number): Promise<number>;
    stop(): void;
}
export {};
