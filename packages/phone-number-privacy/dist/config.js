"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const functions = __importStar(require("firebase-functions"));
const web3_1 = __importDefault(require("web3"));
const logger_1 = __importDefault(require("./common/logger"));
exports.DEV_MODE = process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true';
exports.DEV_PUBLIC_KEY = 'B+gJTCmTrf9t3X7YQ2F4xekSzd5xg5bdzcJ8NPefby3mScelg5172zl1GgIO9boADEwE67j6M55GwouQwaG5jDZ5tHa2eNtfC7oLIsevuUmzrXVDry9cmsalB0BHX0EA';
exports.DEV_PRIVATE_KEY = '1DNeOAuBYhR9BIKKChUOatB1Ha6cK/sG9p7XT2tjYQ8=';
let config;
if (exports.DEV_MODE) {
    logger_1.default.debug('Running in dev mode');
    config = {
        blockchain: {
            provider: 'https://alfajores-forno.celo-testnet.org',
        },
        salt: {
            unverifiedQueryMax: 2,
            additionalVerifiedQueryMax: 30,
            queryPerTransaction: 2,
            minDollarBalance: new bignumber_js_1.default(web3_1.default.utils.toWei('0.1')),
        },
        db: {
            user: 'postgres',
            password: 'fakePass',
            database: 'phoneNumberPrivacy',
            host: 'fakeHost',
        },
        keyVault: {
            azureClientID: 'useMock',
            azureClientSecret: 'useMock',
            azureTenant: 'useMock',
            azureVaultName: 'useMock',
            azureSecretName: 'useMock',
        },
        attestations: {
            numberAttestationsRequired: 3,
        },
    };
}
else {
    const functionConfig = functions.config();
    config = {
        blockchain: {
            provider: functionConfig.blockchain.provider,
        },
        salt: {
            unverifiedQueryMax: functionConfig.salt.unverified_query_max,
            additionalVerifiedQueryMax: functionConfig.salt.additional_verified_query_max,
            queryPerTransaction: functionConfig.salt.query_per_transaction,
            minDollarBalance: new bignumber_js_1.default(functionConfig.salt.min_dollar_balance),
        },
        db: {
            user: functionConfig.db.username,
            password: functionConfig.db.pass,
            database: functionConfig.db.name,
            host: `/cloudsql/${functionConfig.db.host}`,
        },
        keyVault: {
            azureClientID: functionConfig.keyvault.azure_client_id,
            azureClientSecret: functionConfig.keyvault.azure_client_secret,
            azureTenant: functionConfig.keyvault.azure_tenant,
            azureVaultName: functionConfig.keyvault.azure_vault_name,
            azureSecretName: functionConfig.keyvault.azure_secret_name,
        },
        attestations: {
            numberAttestationsRequired: functionConfig.attestations.number_attestations_required,
        },
    };
}
exports.default = config;
//# sourceMappingURL=config.js.map