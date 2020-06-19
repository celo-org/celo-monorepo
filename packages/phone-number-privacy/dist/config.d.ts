import BigNumber from 'bignumber.js';
export declare const DEV_MODE: boolean;
export declare const DEV_PUBLIC_KEY = "B+gJTCmTrf9t3X7YQ2F4xekSzd5xg5bdzcJ8NPefby3mScelg5172zl1GgIO9boADEwE67j6M55GwouQwaG5jDZ5tHa2eNtfC7oLIsevuUmzrXVDry9cmsalB0BHX0EA";
export declare const DEV_PRIVATE_KEY = "1DNeOAuBYhR9BIKKChUOatB1Ha6cK/sG9p7XT2tjYQ8=";
interface Config {
    blockchain: {
        provider: string;
    };
    salt: {
        unverifiedQueryMax: number;
        additionalVerifiedQueryMax: number;
        queryPerTransaction: number;
        minDollarBalance: BigNumber;
    };
    db: {
        user: string;
        password: string;
        database: string;
        host: string;
    };
    keyVault: {
        azureClientID: string;
        azureClientSecret: string;
        azureTenant: string;
        azureVaultName: string;
        azureSecretName: string;
    };
    attestations: {
        numberAttestationsRequired: number;
    };
}
declare let config: Config;
export default config;
