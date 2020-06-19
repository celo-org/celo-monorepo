import { ContractKit } from '@celo/contractkit';
export declare function metricExporterWithRestart(providerUrl: string): Promise<void>;
declare type EndReason = {
    reason: 'connection-error';
    error: any;
} | {
    reason: 'subscription-error';
    error: any;
} | {
    reason: 'not-listening';
};
export declare function runMetricExporter(kit: ContractKit): Promise<EndReason>;
export {};
