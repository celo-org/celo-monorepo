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
const azure_key_vault_client_1 = require("@celo/contractkit/lib/utils/azure-key-vault-client");
const blind_threshold_bls_1 = __importDefault(require("blind-threshold-bls"));
const error_utils_1 = require("../common/error-utils");
const logger_1 = __importDefault(require("../common/logger"));
const config_1 = __importStar(require("../config"));
class BLSCryptographyClient {
    /*
     * Computes the BLS signature for the blinded phone number.
     */
    static async computeBlindedSignature(base64BlindedMessage) {
        try {
            const privateKey = await BLSCryptographyClient.getPrivateKey();
            const keyBuffer = Buffer.from(privateKey, 'base64');
            const msgBuffer = Buffer.from(base64BlindedMessage, 'base64');
            logger_1.default.debug('Calling theshold sign');
            const signedMsg = blind_threshold_bls_1.default.signBlindedMessage(keyBuffer, msgBuffer);
            logger_1.default.debug('Back from threshold sign, parsing results');
            if (!signedMsg) {
                throw new Error('Empty threshold sign result');
            }
            return Buffer.from(signedMsg).toString('base64');
        }
        catch (e) {
            logger_1.default.error(error_utils_1.ErrorMessages.SIGNATURE_COMPUTATION_FAILURE, e);
            throw e;
        }
    }
    /**
     * Get singleton privateKey
     */
    static async getPrivateKey() {
        if (config_1.DEV_MODE) {
            return config_1.DEV_PRIVATE_KEY;
        }
        if (BLSCryptographyClient.privateKey) {
            return BLSCryptographyClient.privateKey;
        }
        // Set environment variables for service principal auth
        process.env.AZURE_CLIENT_ID = config_1.default.keyVault.azureClientID;
        process.env.AZURE_CLIENT_SECRET = config_1.default.keyVault.azureClientSecret;
        process.env.AZURE_TENANT_ID = config_1.default.keyVault.azureTenant;
        const vaultName = config_1.default.keyVault.azureVaultName;
        const keyVaultClient = new azure_key_vault_client_1.AzureKeyVaultClient(vaultName);
        const secretName = config_1.default.keyVault.azureSecretName;
        BLSCryptographyClient.privateKey = await keyVaultClient.getSecret(secretName);
        return BLSCryptographyClient.privateKey;
    }
}
exports.BLSCryptographyClient = BLSCryptographyClient;
//# sourceMappingURL=bls-cryptography-client.js.map