import { Address } from '@celo/utils/lib/address';
import { ContractKit } from '../../kit';
import { KeybaseClaim } from './claim';
import { ClaimTypes } from './types';
export declare const keybaseFilePathToProof = ".well-known/celo/";
export declare const proofFileName: (address: string) => string;
export declare const targetURL: (username: string, address: string) => string;
export declare function verifyKeybaseClaim(kit: ContractKit, claim: KeybaseClaim, signer: Address): Promise<string | undefined>;
export declare const createKeybaseClaim: (username: string) => {
    type: ClaimTypes.KEYBASE;
    timestamp: number;
    username: string;
};
