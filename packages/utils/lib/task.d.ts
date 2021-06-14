import { Logger } from './logger';
/**
 * Represent a running task that can be stopped
 *
 * Examples: A poller, a watcher.
 */
export interface RunningTask {
    /** Flag task to be stopped. Might not be inmediate */
    stop(): void;
    /** Indicates wether the task is running */
    isRunning(): boolean;
}
export interface TaskOptions {
    /** Name for the task. To be used in logging messages */
    name: string;
    /** Logger function */
    logger?: Logger;
}
interface RepeatTaskOptions extends TaskOptions {
    /** seconds between repetition */
    timeInBetweenMS: number;
    /** initial delay for first run */
    initialDelayMS?: number;
}
export interface RepeatTaskContext {
    /** Number of times the task has been executed (starts in 1) */
    executionNumber: number;
    /** Flag task to be stopped. Might not be inmediate */
    stopTask(): void;
}
/**
 * Runs an async function eternally until stopped
 *
 * @param fn function to run
 */
export declare function repeatTask(opts: RepeatTaskOptions, fn: (ctx: RepeatTaskContext) => Promise<void>): RunningTask;
export declare function conditionWatcher(opts: RepeatTaskOptions & {
    pollCondition: () => Promise<boolean>;
    onSuccess: () => void | Promise<void>;
}): RunningTask;
export interface RunningTaskWithValue<A> extends RunningTask {
    onValue(): Promise<A>;
}
export interface RetryTaskOptions<A> extends TaskOptions {
    /** seconds between repetition */
    timeInBetweenMS: number;
    /** Maximum number of attemps */
    maxAttemps: number;
    /** Function that tries to obtain a value A or returns null */
    tryGetValue: () => Promise<A | null>;
}
export declare function tryObtainValueWithRetries<A>(opts: RetryTaskOptions<A>): RunningTaskWithValue<A>;
export {};
