/// <reference types="node" />
export interface EIP712Parameter {
    name: string;
    type: string;
}
export interface EIP712Types {
    [key: string]: EIP712Parameter[];
}
export declare type EIP712ObjectValue = string | number | EIP712Object;
export interface EIP712Object {
    [key: string]: EIP712ObjectValue;
}
export interface EIP712TypedData {
    types: EIP712Types;
    domain: EIP712Object;
    message: EIP712Object;
    primaryType: string;
}
/**
 * Generates the EIP712 Typed Data hash for signing
 * @param   typedData An object that conforms to the EIP712TypedData interface
 * @return  A Buffer containing the hash of the typed data.
 */
export declare function generateTypedDataHash(typedData: EIP712TypedData): Buffer;
export declare function structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer;
