import { Model } from './model';
export declare const NUMBER_PAIRS_TABLE = "number_pairs";
export declare enum NUMBER_PAIRS_COLUMN {
    userPhoneHash = "user_phone_hash",
    contactPhoneHash = "contact_phone_hash"
}
export declare class NumberPair extends Model {
    [NUMBER_PAIRS_COLUMN.userPhoneHash]: string;
    [NUMBER_PAIRS_COLUMN.contactPhoneHash]: string;
    constructor(userPhoneHash: string, contactPhoneHash: string);
}
