import { ExecResult } from '../evm';
import { PrecompileInput, PrecompileFunc } from './types';
interface Precompiles {
    [key: string]: PrecompileFunc;
}
export interface Func {
    (opts: PrecompileInput): ExecResult;
}
declare const ripemdPrecompileAddress = "0000000000000000000000000000000000000003";
declare const precompiles: Precompiles;
declare function getPrecompile(address: string): PrecompileFunc;
export { precompiles, getPrecompile, PrecompileFunc, PrecompileInput, ripemdPrecompileAddress };
