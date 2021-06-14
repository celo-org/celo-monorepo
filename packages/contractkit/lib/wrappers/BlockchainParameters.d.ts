import { BlockchainParameters } from '../generated/BlockchainParameters';
import { BaseWrapper } from './BaseWrapper';
/**
 * Network parameters that are configurable by governance.
 */
export declare class BlockchainParametersWrapper extends BaseWrapper<BlockchainParameters> {
    /**
     * Setting the extra intrinsic gas for transactions, where gas is paid using non-gold currency.
     */
    setIntrinsicGasForAlternativeFeeCurrency: (gas: string | number) => import("./BaseWrapper").CeloTransactionObject<void>;
    /**
     * Getting the block gas limit.
     */
    getBlockGasLimit: () => Promise<number>;
    /**
     * Setting the block gas limit.
     */
    setBlockGasLimit: (gasLimit: string | number) => import("./BaseWrapper").CeloTransactionObject<void>;
    /**
     * Set minimum client version.
     */
    setMinimumClientVersion: (major: string | number, minor: string | number, patch: string | number) => import("./BaseWrapper").CeloTransactionObject<void>;
}
