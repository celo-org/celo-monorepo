import { Freezer } from '../generated/Freezer';
import { BaseWrapper } from './BaseWrapper';
export declare class FreezerWrapper extends BaseWrapper<Freezer> {
    freeze: (target: string) => import("./BaseWrapper").CeloTransactionObject<void>;
    unfreeze: (target: string) => import("./BaseWrapper").CeloTransactionObject<void>;
    isFrozen: (arg0: string) => Promise<boolean>;
}
