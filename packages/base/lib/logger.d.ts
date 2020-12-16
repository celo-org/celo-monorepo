export declare type Logger = (...args: any[]) => void;
export declare const noopLogger: Logger;
export declare const prefixLogger: (prefix: string, logger: Logger) => Logger;
export declare const consoleLogger: Logger;
