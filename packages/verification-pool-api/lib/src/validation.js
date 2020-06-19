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
Object.defineProperty(exports, "__esModule", { value: true });
const contractkit_1 = require("@celo/contractkit");
const ethjsutil = __importStar(require("ethereumjs-util"));
const config_1 = require("./config");
const kit = contractkit_1.newKitFromWeb3(config_1.web3);
function parseBase64(source) {
    return ethjsutil.bufferToHex(Buffer.from(source, 'base64'));
}
exports.parseBase64 = parseBase64;
function validateRequest(phoneNumber, account, message, issuer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const attestations = yield kit.contracts.getAttestations();
            return yield attestations.validateAttestationCode(phoneNumber, account, issuer, message);
        }
        catch (e) {
            console.error('Error validating attestation', e);
            return false;
        }
    });
}
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map