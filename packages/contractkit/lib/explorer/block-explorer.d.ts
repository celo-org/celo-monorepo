import { Block, Transaction } from 'web3-eth';
import { ContractKit } from '../kit';
import { ContractDetails } from './base';
export interface CallDetails {
    contract: string;
    function: string;
    paramMap: Record<string, any>;
    argList: any[];
}
export interface ParsedTx {
    callDetails: CallDetails;
    tx: Transaction;
}
export interface ParsedBlock {
    block: Block;
    parsedTx: ParsedTx[];
}
export declare function newBlockExplorer(kit: ContractKit): Promise<BlockExplorer>;
export declare class BlockExplorer {
    private kit;
    readonly contractDetails: ContractDetails[];
    private addressMapping;
    constructor(kit: ContractKit, contractDetails: ContractDetails[]);
    fetchBlockByHash(blockHash: string): Promise<Block>;
    fetchBlock(blockNumber: number): Promise<Block>;
    fetchBlockRange(from: number, to: number): Promise<Block[]>;
    parseBlock(block: Block): ParsedBlock;
    tryParseTx(tx: Transaction): null | ParsedTx;
    tryParseTxInput(address: string, input: string): null | CallDetails;
}
