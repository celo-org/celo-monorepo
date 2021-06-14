import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { DowntimeSlasher } from '../generated/DowntimeSlasher';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
export interface DowntimeSlasherConfig {
    slashableDowntime: number;
    slashingIncentives: {
        reward: BigNumber;
        penalty: BigNumber;
    };
}
export interface DowntimeWindow {
    start: number;
    end: number;
    length: number;
}
/**
 * Contract handling slashing for Validator downtime
 */
export declare class DowntimeSlasherWrapper extends BaseWrapper<DowntimeSlasher> {
    /**
     * Returns slashing incentives.
     * @return Rewards and penaltys for slashing.
     */
    slashingIncentives: () => Promise<{
        reward: BigNumber;
        penalty: BigNumber;
    }>;
    /**
     * Returns slashable downtime in blocks.
     * @return The number of consecutive blocks before a Validator missing from IBFT consensus
     * can be slashed.
     */
    slashableDowntime: () => Promise<number>;
    /**
     * Returns current configuration parameters.
     */
    getConfig(): Promise<DowntimeSlasherConfig>;
    /**
     * Tests if a validator has been down.
     * @param startBlock First block of the downtime.
     * @param startSignerIndex Validator index at the first block.
     * @param endSignerIndex Validator index at the last block.
     */
    isDown: (startBlock: string | number, startSignerIndex: string | number, endSignerIndex: string | number) => Promise<boolean>;
    /**
     * Tests if the given validator or signer has been down.
     * @param validatorOrSignerAddress Address of the validator account or signer.
     * @param startBlock First block of the downtime, undefined if using endBlock.
     * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
     */
    isValidatorDown(validatorOrSignerAddress: Address, startBlock?: number, endBlock?: number): Promise<boolean>;
    /**
     * Determines the validator signer given an account or signer address and block number.
     * @param validatorOrSignerAddress Address of the validator account or signer.
     * @param blockNumber Block at which to determine the signer index.
     */
    getValidatorSignerIndex(validatorOrSignerAddress: Address, blockNumber: number): Promise<number>;
    /**
     * Slash a Validator for downtime.
     * @param validator Validator account or signer to slash for downtime.
     * @param startBlock First block of the downtime, undefined if using endBlock.
     * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
     */
    slashValidator(validatorOrSignerAddress: Address, startBlock?: number, endBlock?: number): Promise<CeloTransactionObject<void>>;
    /**
     * Slash a Validator for downtime.
     * @param startBlock First block of the downtime.
     * @param startSignerIndex Validator index at the first block.
     */
    slashStartSignerIndex(startBlock: number, startSignerIndex: number): Promise<CeloTransactionObject<void>>;
    /**
     * Slash a Validator for downtime.
     * @param endBlock The last block of the downtime to slash for.
     * @param endSignerIndex Validator index at the last block.
     */
    slashEndSignerIndex(endBlock: number, endSignerIndex: number): Promise<CeloTransactionObject<void>>;
    /**
     * Slash a Validator for downtime.
     * @param validator Validator to slash for downtime.
     * @param startBlock First block of the downtime.
     * @param startSignerIndex Validator index at the first block.
     * @param endSignerIndex Validator index at the last block.
     */
    private slash;
    /**
     * Calculate the slashable window with respect to a provided start or end block number.
     * @param startBlock First block of the downtime. Determined from endBlock if not provided.
     * @param endBlock Last block of the downtime. Determined from startBlock or grandparent of latest block if not provided.
     */
    private getSlashableDowntimeWindow;
}
