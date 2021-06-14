/** Sleep for a number of milliseconds */
export declare function sleep(ms: number): Promise<void>;
declare type InFunction<T extends any[], U> = (...params: T) => Promise<U>;
export declare const retryAsync: <T extends any[], U>(inFunction: InFunction<T, U>, tries: number, params: T, delay?: number) => Promise<U>;
export declare const retryAsyncWithBackOff: <T extends any[], U>(inFunction: InFunction<T, U>, tries: number, params: T, delay?: number, factor?: number) => Promise<U>;
/**
 * Map an async function over a list xs with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param xs list of value
 * @param mapFn mapping function
 */
export declare function concurrentMap<A, B>(concurrency: number, xs: A[], mapFn: (val: A, idx: number) => Promise<B>): Promise<B[]>;
/**
 * Map an async function over the values in Object x with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param x associative array of values
 * @param mapFn mapping function
 */
export declare function concurrentValuesMap<IN extends any, OUT extends any>(concurrency: number, x: Record<string, IN>, mapFn: (val: IN, key: string) => Promise<OUT>): Promise<Record<string, OUT>>;
export {};
