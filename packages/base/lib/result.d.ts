export interface OkResult<TResult> {
    ok: true;
    result: TResult;
}
export interface ErrorResult<TError extends Error> {
    ok: false;
    error: TError;
}
export declare type Result<TResult, TError extends Error> = OkResult<TResult> | ErrorResult<TError>;
export declare const Ok: <TResult>(result: TResult) => OkResult<TResult>;
export declare const Err: <TError extends Error>(error: TError) => ErrorResult<TError>;
export declare function throwIfError<TResult, TError extends Error, TModifiedError extends Error>(result: Result<TResult, TError>, errorModifier?: (error: TError) => TModifiedError): TResult;
export declare function makeThrowable<TArgs extends any[], TResult, TError extends Error, TModifiedError extends Error>(f: (...args: TArgs) => Result<TResult, TError>, errorModifier?: (error: TError) => TModifiedError): (...args: TArgs) => TResult;
export declare function makeAsyncThrowable<TArgs extends any[], TResult, TError extends Error, TModifiedError extends Error>(f: (...args: TArgs) => Promise<Result<TResult, TError>>, errorModifier?: (error: TError) => TModifiedError): (...args: TArgs) => Promise<TResult>;
export interface BaseError<T> {
    errorType: T;
}
export declare class RootError<T> extends Error implements BaseError<T> {
    readonly errorType: T;
    constructor(errorType: T);
}
export declare const JSONParseErrorType = "JsonParseError";
export declare class JSONParseError extends RootError<string> {
    readonly error: Error;
    constructor(error: Error);
}
export declare function parseJsonAsResult(data: string): OkResult<any> | ErrorResult<JSONParseError>;
