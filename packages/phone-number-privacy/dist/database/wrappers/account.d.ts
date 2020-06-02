import { Transaction } from 'knex';
export declare function getPerformedQueryCount(account: string, trx: Transaction): Promise<number>;
export declare function incrementQueryCount(account: string, trx: Transaction): Promise<boolean | undefined>;
export declare function getDidMatchmaking(account: string): Promise<boolean>;
export declare function setDidMatchmaking(account: string): Promise<number | boolean>;
