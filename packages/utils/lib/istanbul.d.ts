import BigNumber from 'bignumber.js';
import { Address } from './address';
export declare type Bitmap = BigNumber;
export interface Seal {
    bitmap: Bitmap;
    signature: string;
    round: BigNumber;
}
export interface IstanbulExtra {
    addedValidators: Address[];
    addedValidatorsPublicKeys: string[];
    removedValidators: Bitmap;
    seal: string;
    aggregatedSeal: Seal;
    parentAggregatedSeal: Seal;
}
export declare function parseBlockExtraData(data: string): IstanbulExtra;
export declare function bitIsSet(bitmap: Bitmap, index: number): boolean;
export declare const IstanbulUtils: {
    parseBlockExtraData: typeof parseBlockExtraData;
    bitIsSet: typeof bitIsSet;
};
