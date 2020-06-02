import { Model } from './model';
export declare const ACCOUNTS_TABLE = "accounts";
export declare enum ACCOUNTS_COLUMNS {
    address = "address",
    createdAt = "created_at",
    numLookups = "num_lookups",
    didMatchmaking = "did_matchmaking"
}
export declare class Account extends Model {
    address: string;
    createdAt: number;
    numLookups: number;
    didMatchmaking: number | null;
    constructor(address: string);
}
