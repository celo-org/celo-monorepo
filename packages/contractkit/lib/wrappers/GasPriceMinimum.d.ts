import BigNumber from 'bignumber.js';
import { GasPriceMinimum } from '../generated/GasPriceMinimum';
import { BaseWrapper } from './BaseWrapper';
export interface GasPriceMinimumConfig {
    gasPriceMinimum: BigNumber;
    targetDensity: BigNumber;
    adjustmentSpeed: BigNumber;
}
/**
 * Stores the gas price minimum
 */
export declare class GasPriceMinimumWrapper extends BaseWrapper<GasPriceMinimum> {
    /**
     * Query current gas price minimum in gGLD.
     * @returns current gas price minimum in cGLD
     */
    gasPriceMinimum: () => Promise<BigNumber>;
    /**
     * Query current gas price minimum.
     * @returns current gas price minimum in the requested currency
     */
    getGasPriceMinimum: (tokenAddress: string) => Promise<BigNumber>;
    /**
     * Query target density parameter.
     * @returns the current block density targeted by the gas price minimum algorithm.
     */
    targetDensity: () => Promise<BigNumber>;
    /**
     * Query adjustment speed parameter
     * @returns multiplier that impacts how quickly gas price minimum is adjusted.
     */
    adjustmentSpeed: () => Promise<BigNumber>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<GasPriceMinimumConfig>;
}
