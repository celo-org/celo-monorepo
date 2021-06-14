import { provider } from 'web3-core';
export declare function hasProperty<T>(object: any, property: string): object is T;
export declare function stopProvider(defaultProvider: provider): void;
