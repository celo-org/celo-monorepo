export declare class Future<T> {
    private promise;
    private _finished;
    private _error;
    private _resolve;
    private _reject;
    constructor();
    get finished(): boolean;
    get error(): any;
    resolve(value: T): void;
    reject(error: any): void;
    wait(): Promise<T>;
    asPromise(): Promise<T>;
}
export declare function toFuture<A>(p: Promise<A>): Future<A>;
export declare function pipeToFuture<A>(p: Promise<A>, future: Future<A>): Future<A>;
