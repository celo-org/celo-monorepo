import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { Reserve } from '../generated/Reserve';
import { BaseWrapper } from './BaseWrapper';
export interface ReserveConfig {
    tobinTaxStalenessThreshold: BigNumber;
    frozenReserveGoldStartBalance: BigNumber;
    frozenReserveGoldStartDay: BigNumber;
    frozenReserveGoldDays: BigNumber;
    otherReserveAddresses: string[];
}
/**
 * Contract for handling reserve for stable currencies
 */
export declare class ReserveWrapper extends BaseWrapper<Reserve> {
    /**
     * Query Tobin tax staleness threshold parameter.
     * @returns Current Tobin tax staleness threshold.
     */
    tobinTaxStalenessThreshold: () => Promise<BigNumber>;
    isSpender: (account: string) => Promise<boolean>;
    transferGold: (to: string, value: string | number) => import("./BaseWrapper").CeloTransactionObject<boolean>;
    getOrComputeTobinTax: () => import("./BaseWrapper").CeloTransactionObject<{
        0: string;
        1: string;
    }>;
    frozenReserveGoldStartBalance: () => Promise<BigNumber>;
    frozenReserveGoldStartDay: () => Promise<BigNumber>;
    frozenReserveGoldDays: () => Promise<BigNumber>;
    getReserveGoldBalance: () => Promise<BigNumber>;
    getOtherReserveAddresses: () => Promise<string[]>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<ReserveConfig>;
    isOtherReserveAddress: (arg0: string) => Promise<boolean>;
    getSpenders(): Promise<Address[]>;
}
