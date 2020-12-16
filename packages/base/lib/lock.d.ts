export declare class Lock {
    private locked;
    private emitter;
    constructor();
    tryAcquire(): boolean;
    acquire(): Promise<void>;
    release(): void;
}
