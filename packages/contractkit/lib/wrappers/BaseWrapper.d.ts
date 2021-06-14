/// <reference types="node" />
import BigNumber from 'bignumber.js';
import { EventLog, TransactionReceipt, Tx } from 'web3-core';
import { TransactionObject } from 'web3-eth';
import { Contract, PastEventOptions } from 'web3-eth-contract';
import { ContractKit } from '../kit';
import { TransactionResult } from '../utils/tx-result';
/** Represents web3 native contract Method */
declare type Method<I extends any[], O> = (...args: I) => TransactionObject<O>;
export interface Filter {
    [key: string]: number | string | string[] | number[];
}
/** Base ContractWrapper */
export declare abstract class BaseWrapper<T extends Contract> {
    protected readonly kit: ContractKit;
    protected readonly contract: T;
    constructor(kit: ContractKit, contract: T);
    /** Contract address */
    get address(): string;
    /** Contract getPastEvents */
    getPastEvents(event: string, options: PastEventOptions): Promise<EventLog[]>;
    events: any;
}
export declare const valueToBigNumber: (input: BigNumber.Value) => BigNumber;
export declare const fixidityValueToBigNumber: (input: BigNumber.Value) => BigNumber;
export declare const valueToString: (input: BigNumber.Value) => string;
export declare const valueToFixidityString: (input: BigNumber.Value) => string;
export declare const valueToInt: (input: BigNumber.Value) => number;
export declare const valueToFrac: (numerator: BigNumber.Value, denominator: BigNumber.Value) => BigNumber;
declare type SolidityBytes = string | number[];
export declare const stringToSolidityBytes: (input: string) => SolidityBytes;
export declare const bufferToSolidityBytes: (input: Buffer) => SolidityBytes;
export declare const solidityBytesToString: (input: SolidityBytes) => string;
declare type Parser<A, B> = (input: A) => B;
/** Identity Parser */
export declare const identity: <A>(a: A) => A;
export declare const stringIdentity: (x: string) => string;
/**
 * Tuple parser
 * Useful to map different input arguments
 */
export declare function tupleParser<A0, B0>(parser0: Parser<A0, B0>): (...args: [A0]) => [B0];
export declare function tupleParser<A0, B0, A1, B1>(parser0: Parser<A0, B0>, parser1: Parser<A1, B1>): (...args: [A0, A1]) => [B0, B1];
export declare function tupleParser<A0, B0, A1, B1, A2, B2>(parser0: Parser<A0, B0>, parser1: Parser<A1, B1>, parser2: Parser<A2, B2>): (...args: [A0, A1, A2]) => [B0, B1, B2];
export declare function tupleParser<A0, B0, A1, B1, A2, B2, A3, B3>(parser0: Parser<A0, B0>, parser1: Parser<A1, B1>, parser2: Parser<A2, B2>, parser3: Parser<A3, B3>): (...args: [A0, A1, A2, A3]) => [B0, B1, B2, B3];
/**
 * Creates a proxy to call a web3 native contract method.
 *
 * There are 4 cases:
 *  - methodFn
 *  - parseInputArgs => methodFn
 *  - parseInputArgs => methodFn => parseOutput
 *  - methodFn => parseOutput
 *
 * @param methodFn Web3 methods function
 * @param parseInputArgs [optional] parseInputArgs function, tranforms arguments into `methodFn` expected inputs
 * @param parseOutput [optional] parseOutput function, transforms `methodFn` output into proxy return
 */
export declare function proxyCall<InputArgs extends any[], ParsedInputArgs extends any[], PreParsedOutput, Output>(methodFn: Method<ParsedInputArgs, PreParsedOutput>, parseInputArgs: (...args: InputArgs) => ParsedInputArgs, parseOutput: (o: PreParsedOutput) => Output): (...args: InputArgs) => Promise<Output>;
export declare function proxyCall<InputArgs extends any[], PreParsedOutput, Output>(methodFn: Method<InputArgs, PreParsedOutput>, x: undefined, parseOutput: (o: PreParsedOutput) => Output): (...args: InputArgs) => Promise<Output>;
export declare function proxyCall<InputArgs extends any[], ParsedInputArgs extends any[], Output>(methodFn: Method<ParsedInputArgs, Output>, parseInputArgs: (...args: InputArgs) => ParsedInputArgs): (...args: InputArgs) => Promise<Output>;
export declare function proxyCall<InputArgs extends any[], Output>(methodFn: Method<InputArgs, Output>): (...args: InputArgs) => Promise<Output>;
/**
 * Specifies all different possible proxySend arguments so that
 * it always return a function of type: (...args:InputArgs) => CeloTransactionObject<Output>
 *
 * cases:
 *  - methodFn
 *  - parseInputArgs => methodFn
 */
declare type ProxySendArgs<InputArgs extends any[], ParsedInputArgs extends any[], Output> = [Method<ParsedInputArgs, Output>, (...arg: InputArgs) => ParsedInputArgs] | [Method<InputArgs, Output>];
/**
 * Creates a proxy to send a tx on a web3 native contract method.
 *
 * There are 2 cases:
 *  - call methodFn (no pre or post parsing)
 *  - preParse arguments & call methodFn
 *
 * @param methodFn Web3 methods function
 * @param preParse [optional] preParse function, tranforms arguments into `methodFn` expected inputs
 */
export declare function proxySend<InputArgs extends any[], ParsedInputArgs extends any[], Output>(kit: ContractKit, ...sendArgs: ProxySendArgs<InputArgs, ParsedInputArgs, Output>): (...args: InputArgs) => CeloTransactionObject<Output>;
export declare function toTransactionObject<O>(kit: ContractKit, txo: TransactionObject<O>, defaultParams?: Omit<Tx, 'data'>): CeloTransactionObject<O>;
export declare type CeloTransactionParams = Omit<Tx, 'data'>;
export declare class CeloTransactionObject<O> {
    private kit;
    readonly txo: TransactionObject<O>;
    readonly defaultParams?: Pick<Tx, "chainId" | "value" | "from" | "to" | "gatewayFeeRecipient" | "gatewayFee" | "gas" | "feeCurrency" | "nonce" | "gasPrice" | "common" | "chain" | "hardfork"> | undefined;
    constructor(kit: ContractKit, txo: TransactionObject<O>, defaultParams?: Pick<Tx, "chainId" | "value" | "from" | "to" | "gatewayFeeRecipient" | "gatewayFee" | "gas" | "feeCurrency" | "nonce" | "gasPrice" | "common" | "chain" | "hardfork"> | undefined);
    /** send the transaction to the chain */
    send: (params?: Pick<Tx, "chainId" | "value" | "from" | "to" | "gatewayFeeRecipient" | "gatewayFee" | "gas" | "feeCurrency" | "nonce" | "gasPrice" | "common" | "chain" | "hardfork"> | undefined) => Promise<TransactionResult>;
    /** send the transaction and waits for the receipt */
    sendAndWaitForReceipt: (params?: Pick<Tx, "chainId" | "value" | "from" | "to" | "gatewayFeeRecipient" | "gatewayFee" | "gas" | "feeCurrency" | "nonce" | "gasPrice" | "common" | "chain" | "hardfork"> | undefined) => Promise<TransactionReceipt>;
}
export {};
