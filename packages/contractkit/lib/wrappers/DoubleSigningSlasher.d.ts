import BigNumber from 'bignumber.js';
import { Address } from '../base';
import { DoubleSigningSlasher } from '../generated/DoubleSigningSlasher';
import { BaseWrapper, CeloTransactionObject } from './BaseWrapper';
/**
 * Contract handling slashing for Validator double-signing
 */
export declare class DoubleSigningSlasherWrapper extends BaseWrapper<DoubleSigningSlasher> {
    /**
     * Returns slashing incentives.
     * @return Rewards and penaltys for slashing.
     */
    slashingIncentives: () => Promise<{
        reward: BigNumber;
        penalty: BigNumber;
    }>;
    /**
     * Parses block number out of header.
     * @param header RLP encoded header
     * @return Block number.
     */
    getBlockNumberFromHeader(header: string): Promise<number>;
    /**
     * Slash a Validator for double-signing.
     * @param validator Validator to slash.
     * @param headerA First double signed block header.
     * @param headerB Second double signed block header.
     */
    slashValidator(validatorAddress: Address, headerA: string, headerB: string): Promise<CeloTransactionObject<void>>;
    /**
     * Slash a Validator for double-signing.
     * @param validator Validator to slash.
     * @param headerA First double signed block header.
     * @param headerB Second double signed block header.
     */
    slashSigner(signerAddress: Address, headerA: string, headerB: string): Promise<CeloTransactionObject<void>>;
    /**
     * Slash a Validator for double-signing.
     * @param signerIndex Validator index at the block.
     * @param headerA First double signed block header.
     * @param headerB Second double signed block header.
     */
    private slash;
}
