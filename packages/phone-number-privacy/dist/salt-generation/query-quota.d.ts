import { Transaction } from 'knex';
export declare function getRemainingQueryCount(trx: Transaction, account: string, hashedPhoneNumber?: string): Promise<number>;
