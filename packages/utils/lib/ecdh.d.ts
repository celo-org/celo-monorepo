/// <reference types="node" />
export declare function computeSharedSecret(privateKey: string, publicKey: string): Buffer;
export declare function isCompressed(publicKey: string): boolean;
export declare function ensureCompressed(publicKey: string): string;
export declare function ensureUncompressed(publicKey: string): string;
export declare function trimUncompressedPrefix(publicKey: string): string;
