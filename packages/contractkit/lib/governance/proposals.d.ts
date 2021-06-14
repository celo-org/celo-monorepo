/// <reference types="node" />
import { Transaction, TransactionObject } from 'web3-eth';
import { CeloContract } from '../base';
import { ContractKit } from '../kit';
import { CeloTransactionObject } from '../wrappers/BaseWrapper';
import { Proposal, ProposalTransaction } from '../wrappers/Governance';
export declare const HOTFIX_PARAM_ABI_TYPES: string[];
export declare const hotfixToEncodedParams: (kit: ContractKit, proposal: Proposal, salt: Buffer) => string;
export declare const hotfixToHash: (kit: ContractKit, proposal: Proposal, salt: Buffer) => Buffer;
/**
 * JSON encoding of a proposal transaction.
 *
 * Example:
 * ```json
 * {
 *   "contract": "Election",
 *   "function": "setElectableValidators",
 *   "args": [ "1", "120" ],
 *   "value": "0"
 * }
 * ```
 */
export interface ProposalTransactionJSON {
    contract: CeloContract;
    function: string;
    args: any[];
    params?: Record<string, any>;
    value: string;
}
/**
 * Convert a compiled proposal to a human-readable JSON form using network information.
 * @param kit Contract kit instance used to resolve addresses to contract names.
 * @param proposal A constructed proposal object.
 * @returns The JSON encoding of the proposal.
 */
export declare const proposalToJSON: (kit: ContractKit, proposal: Proposal) => Promise<ProposalTransactionJSON[]>;
declare type ProposalTxParams = Pick<ProposalTransaction, 'to' | 'value'>;
/**
 * Builder class to construct proposals from JSON or transaction objects.
 */
export declare class ProposalBuilder {
    private readonly kit;
    private readonly builders;
    constructor(kit: ContractKit, builders?: Array<() => Promise<ProposalTransaction>>);
    /**
     * Build calls all of the added build steps and returns the final proposal.
     * @returns A constructed Proposal object (i.e. a list of ProposalTransaction)
     */
    build: () => Promise<Pick<Transaction, "value" | "to" | "input">[]>;
    /**
     * Converts a Web3 transaction into a proposal transaction object.
     * @param tx A Web3 transaction object to convert.
     * @param params Parameters for how the transaction should be executed.
     */
    fromWeb3tx: (tx: TransactionObject<any>, params: Pick<Pick<Transaction, "value" | "to" | "input">, "value" | "to">) => Pick<Transaction, "value" | "to" | "input">;
    /**
     * Adds a transaction to set the implementation on a proxy to the given address.
     * @param contract Celo contract name of the proxy which should have its implementation set.
     * @param newImplementationAddress Address of the new contract implementation.
     */
    addProxyRepointingTx: (contract: CeloContract, newImplementationAddress: string) => void;
    /**
     * Adds a Web3 transaction to the list for proposal construction.
     * @param tx A Web3 transaction object to add to the proposal.
     * @param params Parameters for how the transaction should be executed.
     */
    addWeb3Tx: (tx: TransactionObject<any>, params: Pick<Pick<Transaction, "value" | "to" | "input">, "value" | "to">) => number;
    /**
     * Adds a Celo transaction to the list for proposal construction.
     * @param tx A Celo transaction object to add to the proposal.
     * @param params Optional parameters for how the transaction should be executed.
     */
    addTx(tx: CeloTransactionObject<any>, params?: Partial<ProposalTxParams>): void;
    /**
     * Adds a JSON encoded proposal transaction to the builder list.
     * @param tx A JSON encoded proposal transaction.
     */
    addJsonTx: (tx: ProposalTransactionJSON) => number;
}
export {};
