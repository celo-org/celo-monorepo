import { Address, CeloContract } from './base';
import { ContractKit } from './kit';
/**
 * Celo Core Contract's Address Registry
 */
export declare class AddressRegistry {
    private readonly registry;
    private readonly cache;
    constructor(kit: ContractKit);
    /**
     * Get the address for a `CeloContract`
     */
    addressFor(contract: CeloContract): Promise<Address>;
    /**
     * Get the address for all possible `CeloContract`
     */
    allAddresses(): Promise<Record<CeloContract, Address>>;
}
