/// <reference types="node" />
import BN = require('bn.js');
import Common from 'ethereumjs-common';
import { ExecResult } from '../evm';
import PStateManager from '../../state/promisified';
export interface PrecompileFunc {
    (opts: PrecompileInput): Promise<ExecResult>;
}
export interface PrecompileInput {
    data: Buffer;
    gasLimit: BN;
    _common: Common;
    _state: PStateManager;
}
