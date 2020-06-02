import knex from 'knex';
export declare function getDatabase(): knex<any, unknown[]>;
export declare function getTransaction(): Promise<knex.Transaction<any, any>>;
