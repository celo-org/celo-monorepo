import { Model } from './model';
export declare const ACCOUNTS_TABLE = "accounts";
export declare enum ACCOUNTS_COLUMNS {
    address = "address",
    createdAt = "created_at",
    numLookups = "num_lookups",
    didMatchmaking = "did_matchmaking"
}
export declare class Account extends Model {
    [ACCOUNTS_COLUMNS.address]: string;
    [ACCOUNTS_COLUMNS.createdAt]: Date;
    [ACCOUNTS_COLUMNS.numLookups]: number;
    [ACCOUNTS_COLUMNS.didMatchmaking]: Date | null;
    constructor(address: string);
}
