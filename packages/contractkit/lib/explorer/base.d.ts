import { Address } from '@celo/utils/lib/address';
import { ABIDefinition } from 'web3-eth-abi';
import { ContractKit } from '../kit';
export interface ContractDetails {
    name: string;
    address: Address;
    jsonInterface: ABIDefinition[];
}
export declare function obtainKitContractDetails(kit: ContractKit): Promise<ContractDetails[]>;
export declare function mapFromPairs<A, B>(pairs: Array<[A, B]>): Map<A, B>;
