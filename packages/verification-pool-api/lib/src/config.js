"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("firebase-functions"));
const nexmo_1 = __importDefault(require("nexmo"));
const twilio_1 = __importDefault(require("twilio"));
const web3_1 = __importDefault(require("web3"));
const Attestations_1 = __importDefault(require("../contracts/Attestations"));
const GoldToken_1 = __importDefault(require("../contracts/GoldToken"));
const StableToken_1 = __importDefault(require("../contracts/StableToken"));
const celoEnv_1 = require("./celoEnv");
const types_1 = require("./types");
const functionConfig = functions.config();
exports.poolAddress = functionConfig.shared['eth-address'];
exports.poolPrivateKey = functionConfig.shared['eth-private-key'];
exports.twilioPhoneNum = functionConfig.shared['twilio-phone-number'];
exports.alwaysUseTwilio = functionConfig.shared['always-use-twilio'] === 'true';
exports.fcmKey = functionConfig.shared.fcmkey;
exports.networkid = functionConfig[celoEnv_1.CELO_ENV]['testnet-id'];
exports.appSignature = functionConfig[celoEnv_1.CELO_ENV]['app-signature'];
exports.smsAckTimeout = functionConfig[celoEnv_1.CELO_ENV]['sms-ack-timeout'] || 5000; // default 5 seconds
console.debug(`Config settings: app-signture:${exports.appSignature}, networkId:${exports.networkid}`);
// @ts-ignore
exports.web3 = new web3_1.default(`https://${celoEnv_1.CELO_ENV}-forno.celo-testnet.org`);
let twilioClient;
let nexmoClient;
// Given Node.js single thread model, there shouldn't be any locks required here.
function getTwilioClient() {
    if (twilioClient == null) {
        twilioClient = twilio_1.default(functionConfig.shared['twilio-sid'], functionConfig.shared['twilio-auth-token']);
    }
    return twilioClient;
}
exports.getTwilioClient = getTwilioClient;
function getNexmoClient() {
    if (nexmoClient == null) {
        nexmoClient = new nexmo_1.default({
            apiKey: functionConfig.shared['nexmo-key'],
            apiSecret: functionConfig.shared['nexmo-secret'],
        });
    }
    return nexmoClient;
}
exports.getNexmoClient = getNexmoClient;
function sendSmsWithNexmo(countryCode, phoneNumber, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = getNexmoClient();
        return new Promise((resolve, reject) => {
            client.message.sendSms(functionConfig.shared['nexmo-from-' + countryCode.toLowerCase()], phoneNumber, message, (err, responseData) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (responseData.messages[0].status === '0') {
                        resolve(responseData.messages[0]);
                    }
                    else {
                        reject(responseData.messages[0]['error-text']);
                    }
                }
            });
        });
    });
}
exports.sendSmsWithNexmo = sendSmsWithNexmo;
let attestations;
function getAttestations() {
    return __awaiter(this, void 0, void 0, function* () {
        if (attestations == null) {
            attestations = yield Attestations_1.default(exports.web3);
        }
        return attestations;
    });
}
exports.getAttestations = getAttestations;
let goldToken;
function getGoldToken() {
    return __awaiter(this, void 0, void 0, function* () {
        if (goldToken == null) {
            goldToken = yield GoldToken_1.default(exports.web3);
        }
        return goldToken;
    });
}
exports.getGoldToken = getGoldToken;
let stableToken;
function getStableToken() {
    return __awaiter(this, void 0, void 0, function* () {
        if (stableToken == null) {
            stableToken = yield StableToken_1.default(exports.web3);
        }
        return stableToken;
    });
}
exports.getStableToken = getStableToken;
function getTokenType(tokenAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        if (tokenAddress === (yield getGoldToken()).options.address) {
            return types_1.TokenType.GOLD;
        }
        else if (tokenAddress === (yield getStableToken()).options.address) {
            return types_1.TokenType.DOLLAR;
        }
        else {
            console.error(`Unexpected token type for address: ${tokenAddress}`);
            return null;
        }
    });
}
exports.getTokenType = getTokenType;
function getTokenContract(tokenType) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (tokenType) {
            case types_1.TokenType.GOLD:
                return getGoldToken();
            case types_1.TokenType.DOLLAR:
                return getStableToken();
            default:
                console.error('Unexpected token type', tokenType);
                return null;
        }
    });
}
exports.getTokenContract = getTokenContract;
//# sourceMappingURL=config.js.map